from django.conf import settings

from api.graphql.extensions.legacy_helpers import OldChoiceCharField
from api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from api.graphql.types.reservations.serializers.update_serializers import ReservationUpdateSerializer
from email_notification.helpers.reservation_email_notification_sender import ReservationEmailNotificationSender
from merchants.models import Language, OrderStatus, PaymentOrder
from merchants.verkkokauppa.helpers import create_mock_verkkokauppa_order, get_verkkokauppa_order_params
from merchants.verkkokauppa.order.exceptions import CreateOrderError
from merchants.verkkokauppa.order.types import CreateOrderParams, Order
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from reservation_units.enums import PaymentType, PricingType
from reservation_units.utils.reservation_unit_pricing_helper import ReservationUnitPricingHelper
from reservations.choices import ReservationStateChoice
from reservations.models import Reservation
from utils.decimal_utils import round_decimal
from utils.sentry import SentryLogger


class ReservationConfirmSerializer(ReservationUpdateSerializer):
    payment_type = OldChoiceCharField(
        choices=PaymentType.choices,
        required=False,
        help_text=(
            "Type of the payment. "
            f"Possible values are {', '.join(value[0].upper() for value in PaymentType.choices)}."
        ),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # All fields should be read-only, except for the lookup
        # field (PK) which should be included in the input
        for field in self.fields:
            self.fields[field].read_only = True
        self.fields["pk"].read_only = False
        self.fields["payment_type"].read_only = False

    class Meta(ReservationUpdateSerializer.Meta):
        fields = ["payment_type", *ReservationUpdateSerializer.Meta.fields]

    def _get_default_payment_type(self):
        reservation_unit = self.instance.reservation_unit.first()
        payment_types = reservation_unit.payment_types

        if payment_types.count() == 0:
            raise ValidationErrorWithCode(
                "Reservation unit does not have payment types defined. At least one payment type must be defined.",
                ValidationErrorCodes.INVALID_PAYMENT_TYPE,
            )

        # Rules to pick the default, defined in TILA-1974:
        # 1. If only one payment type is defined, use that
        # 2. If only INVOICE and ON_SITE are defined, use INVOICE
        # 3. Otherwise, use ONLINE

        if payment_types.count() == 1:
            return payment_types.first().code
        elif payment_types.filter(code__in=[PaymentType.INVOICE, PaymentType.ON_SITE]).count() == payment_types.count():
            return PaymentType.INVOICE
        else:
            return PaymentType.ONLINE

    def validate(self, data, prefill_from_profile=False):
        data = super().validate(data)

        if self.instance.payment_order.exists() == 1:
            raise ValidationErrorWithCode(
                "Reservation cannot be changed anymore because it is attached to a payment order",
                ValidationErrorCodes.CHANGES_NOT_ALLOWED,
            )

        elif self.instance.reservation_unit.count() > 1:
            raise ValidationErrorWithCode(
                "Reservations with multiple reservation units are not supported.",
                ValidationErrorCodes.MULTIPLE_RESERVATION_UNITS,
            )

        # If reservation requires handling, it can't be confirmed here and needs to be manually handled by the staff
        if not self.instance.requires_handling:
            payment_type = data.get("payment_type", "").upper()
            reservation_unit = self.instance.reservation_unit.first()

            active_price = ReservationUnitPricingHelper.get_active_price(reservation_unit)
            if active_price.pricing_type == PricingType.PAID or self.instance.price_net > 0:
                if not reservation_unit.payment_product and not settings.MOCK_VERKKOKAUPPA_API_ENABLED:
                    raise ValidationErrorWithCode(
                        "Reservation unit is missing payment product",
                        ValidationErrorCodes.MISSING_PAYMENT_PRODUCT,
                    )

                if not payment_type:
                    data["payment_type"] = self._get_default_payment_type()
                elif not reservation_unit.payment_types.filter(code=payment_type).exists():
                    allowed_values = sorted(x.code for x in reservation_unit.payment_types.all())
                    raise ValidationErrorWithCode(
                        f"Reservation unit does not support {payment_type} payment type. "
                        f"Allowed values: {', '.join(allowed_values)}",
                        ValidationErrorCodes.INVALID_PAYMENT_TYPE,
                    )
        return data

    @property
    def validated_data(self):
        validated_data = super().validated_data
        payment_type = validated_data.get("payment_type", "").upper()

        if self.instance.requires_handling:
            validated_data["state"] = ReservationStateChoice.REQUIRES_HANDLING.value
        elif self.instance.price_net > 0 and payment_type != PaymentType.ON_SITE:
            validated_data["state"] = ReservationStateChoice.WAITING_FOR_PAYMENT.value
        else:
            validated_data["state"] = ReservationStateChoice.CONFIRMED.value

        return validated_data

    def save(self, **kwargs) -> Reservation:
        self.fields.pop("payment_type")
        state = self.validated_data["state"]

        if (
            state
            in [
                ReservationStateChoice.CONFIRMED.value,
                ReservationStateChoice.WAITING_FOR_PAYMENT.value,
            ]
            and self.instance.price_net > 0
        ):
            payment_type = self.validated_data["payment_type"].upper()
            price_net = round_decimal(self.instance.price_net, 2)
            price_vat = round_decimal(self.instance.price_net * (self.instance.tax_percentage_value / 100), 2)
            price_total = round_decimal(self.instance.price, 2)

            if payment_type == PaymentType.ON_SITE:
                PaymentOrder.objects.create(
                    payment_type=payment_type,
                    status=OrderStatus.PAID_MANUALLY,
                    language=self.instance.reservee_language or Language.FI,
                    price_net=price_net,
                    price_vat=price_vat,
                    price_total=price_total,
                    reservation=self.instance,
                )
            else:
                verkkokauppa_order: Order
                if settings.MOCK_VERKKOKAUPPA_API_ENABLED:
                    verkkokauppa_order = create_mock_verkkokauppa_order(self.instance)
                else:
                    order_params: CreateOrderParams = get_verkkokauppa_order_params(self.instance)

                    try:
                        verkkokauppa_order = VerkkokauppaAPIClient.create_order(order_params=order_params)
                    except CreateOrderError as err:
                        SentryLogger.log_exception(
                            err, details="Creating order in Verkkokauppa failed", reservation_id=self.instance.pk
                        )
                        raise ValidationErrorWithCode(
                            "Upstream service call failed. Unable to confirm the reservation.",
                            ValidationErrorCodes.UPSTREAM_CALL_FAILED,
                        ) from err

                PaymentOrder.objects.create(
                    payment_type=payment_type,
                    status=OrderStatus.DRAFT,
                    language=self.instance.reservee_language or Language.FI,
                    price_net=price_net,
                    price_vat=price_vat,
                    price_total=price_total,
                    reservation=self.instance,
                    reservation_user_uuid=self.instance.user.uuid,
                    remote_id=verkkokauppa_order.order_id,
                    checkout_url=verkkokauppa_order.checkout_url,
                    receipt_url=verkkokauppa_order.receipt_url,
                )

        instance = super().save(**kwargs)
        ReservationEmailNotificationSender.send_confirmation_email(reservation=instance)
        return instance
