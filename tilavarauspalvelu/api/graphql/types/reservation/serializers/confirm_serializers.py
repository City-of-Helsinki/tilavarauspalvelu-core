from __future__ import annotations

from typing import TYPE_CHECKING

from django.conf import settings
from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from rest_framework.exceptions import ValidationError
from rest_framework.fields import IntegerField

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import Language, OrderStatus, PaymentType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.helpers import (
    create_mock_verkkokauppa_order,
    get_verkkokauppa_order_params,
)
from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import CreateOrderError
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.models import PaymentOrder, Reservation
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.integrations.verkkokauppa.order.types import CreateOrderParams, Order
    from tilavarauspalvelu.models import ReservationUnit
    from tilavarauspalvelu.typing import ReservationConfirmData


__all__ = [
    "ReservationConfirmSerializer",
]


class ReservationConfirmSerializer(NestingModelSerializer):
    """Confirm a tentative reservation. Reservation might still require handling and/or payment."""

    instance: Reservation

    pk = IntegerField(required=True)

    state = EnumFriendlyChoiceField(
        choices=ReservationStateChoice.choices,
        enum=ReservationStateChoice,
        read_only=True,
    )

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "state",
        ]

    def validate(self, data: ReservationConfirmData) -> ReservationConfirmData:
        self.instance.validator.validate_can_change_reservation()
        self.instance.validator.validate_no_payment_order()
        self.instance.validator.validate_required_metadata_fields()
        self.instance.validator.validate_single_reservation_unit()

        data["confirmed_at"] = local_datetime()

        # If no payment is required, we can skip the rest of the validation.
        if self.instance.price_net == 0:
            data["payment_type"] = None
            data["state"] = self.instance.actions.get_state_on_reservation_confirmed(payment_type=None)
            return data

        reservation_unit: ReservationUnit = self.instance.reservation_units.first()

        reservation_unit.validator.validate_has_payment_type()
        reservation_unit.validator.validate_has_payment_product()

        data["payment_type"] = reservation_unit.actions.get_default_payment_type()
        data["state"] = self.instance.actions.get_state_on_reservation_confirmed(payment_type=data["payment_type"])

        return data

    def update(self, instance: Reservation, validated_data: ReservationConfirmData) -> Reservation:
        state = validated_data["state"]

        if self.instance.price_net > 0 and state.should_create_payment_order:
            self.create_payment_order(payment_type=validated_data["payment_type"])

        instance = super().update(instance=instance, validated_data=validated_data)

        if instance.state == ReservationStateChoice.CONFIRMED:
            EmailService.send_reservation_confirmed_email(reservation=instance)
            EmailService.send_staff_notification_reservation_made_email(reservation=instance)

        elif instance.state == ReservationStateChoice.REQUIRES_HANDLING:
            EmailService.send_reservation_requires_handling_email(reservation=instance)
            EmailService.send_staff_notification_reservation_requires_handling_email(reservation=instance)

        return instance

    def create_payment_order(self, payment_type: PaymentType) -> PaymentOrder:
        if payment_type == PaymentType.ON_SITE:
            return PaymentOrder.objects.create(
                payment_type=payment_type,
                status=OrderStatus.PAID_MANUALLY,
                language=self.instance.reservee_language or Language.FI,
                price_net=self.instance.price_net,
                price_vat=self.instance.price_vat_amount,
                price_total=self.instance.price,
                reservation=self.instance,
            )

        verkkokauppa_order: Order = self.create_order_in_verkkokauppa()

        return PaymentOrder.objects.create(
            payment_type=payment_type,
            status=OrderStatus.DRAFT,
            language=self.instance.reservee_language or Language.FI,
            price_net=self.instance.price_net,
            price_vat=self.instance.price_vat_amount,
            price_total=self.instance.price,
            reservation=self.instance,
            reservation_user_uuid=self.instance.user.uuid,
            remote_id=verkkokauppa_order.order_id,
            checkout_url=verkkokauppa_order.checkout_url,
            receipt_url=verkkokauppa_order.receipt_url,
        )

    def create_order_in_verkkokauppa(self) -> Order:
        if settings.MOCK_VERKKOKAUPPA_API_ENABLED:
            return create_mock_verkkokauppa_order(self.instance)

        order_params: CreateOrderParams = get_verkkokauppa_order_params(self.instance)
        try:
            return VerkkokauppaAPIClient.create_order(order_params=order_params)
        except CreateOrderError as err:
            sentry_msg = "Creating order in Verkkokauppa failed"
            SentryLogger.log_exception(err, details=sentry_msg, reservation_id=self.instance.pk)
            msg = "Upstream service call failed. Unable to confirm the reservation."
            raise ValidationError(msg, code=error_codes.UPSTREAM_CALL_FAILED) from err
