from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from django.conf import settings
from django.db import transaction
from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.fields import IntegerField

from tilavarauspalvelu.enums import AccessType, OrderStatus, PaymentType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation, ReservationPriceLine
from tilavarauspalvelu.services.pricing.price_lines import set_price_line_taxes
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import DEFAULT_TIMEZONE, datetime_difference, local_date, local_datetime
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import ReservationApproveData

__all__ = [
    "ReservationApproveSerializer",
]


class ReservationPriceLineOverrideSerializer(serializers.Serializer):
    """The final amount of one price line of the reservation. A null override amount clears the override."""

    pk = serializers.IntegerField()
    override_amount = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=Decimal(0),
        allow_null=True,
        default=None,
    )


class ReservationApproveSerializer(NestingModelSerializer):
    """Approve a reservation during handling."""

    instance: Reservation

    pk = IntegerField(required=True)

    price_lines = ReservationPriceLineOverrideSerializer(many=True, required=True, write_only=True)

    state = EnumFriendlyChoiceField(
        choices=ReservationStateChoice.choices,
        enum=ReservationStateChoice,
        read_only=True,
    )

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "price_lines",
            "handling_details",
            "handled_at",
            "state",
        ]
        extra_kwargs = {
            "handling_details": {"required": True},
            "handled_at": {"read_only": True},
        }

    def validate(self, data: ReservationApproveData) -> ReservationApproveData:
        self.instance.validators.validate_reservation_state_allows_approving()
        data["state"] = ReservationStateChoice.CONFIRMED
        data["handled_at"] = local_datetime()

        data = self.validate_price_line_overrides(data)

        if settings.PAYMENT_ORDERS_FOR_HANDLED_RESERVATIONS_ENABLED:
            return self.validate_payment_order(data)

        return data

    def validate_price_line_overrides(self, data: ReservationApproveData) -> ReservationApproveData:
        price_lines: list[ReservationPriceLine] = list(self.instance.price_lines.all())
        overrides = data.pop("price_lines")

        line_pks = sorted(line.pk for line in price_lines)
        override_pks = sorted(override["pk"] for override in overrides)

        if not price_lines or line_pks != override_pks:
            msg = "Price lines must contain each price line of the reservation exactly once."
            raise ValidationError(msg, code=error_codes.RESERVATION_PRICE_LINES_MISMATCH)

        price_line_overrides = {override["pk"]: override["override_amount"] for override in overrides}

        new_total_price = Decimal(0)
        for line in price_lines:
            override_amount = price_line_overrides[line.pk]
            new_total_price += line.amount if override_amount is None else override_amount

        data["new_total_price"] = new_total_price
        data["price_line_overrides"] = price_line_overrides
        return data

    def validate_payment_order(self, data: ReservationApproveData) -> ReservationApproveData:
        data["should_delete_previous_payment_order"] = False

        # In case reservation is approved -> set back to handled -> approved, there might be a payment order already
        if hasattr(self.instance, "payment_order"):
            payment_order = self.instance.payment_order

            paid_in_webshop = payment_order.status in OrderStatus.paid_in_webshop
            data["should_delete_previous_payment_order"] = not paid_in_webshop

            if paid_in_webshop:
                # A refunded order stays PAID until the refund webhook arrives.
                if payment_order.refund_id is not None:
                    msg = "Reservation has a payment order with a refund in progress."
                    raise ValidationError(msg, code=error_codes.ORDER_REFUND_IN_PROGRESS)

                if payment_order.price_total != data["new_total_price"]:
                    msg = "Reservation already has a paid payment order with a different price."
                    raise ValidationError(msg, code=error_codes.RESERVATION_PRICE_CANNOT_BE_CHANGED)

                # If price hasn't changed, we can just use the existing payment order.
                return data

        if data["new_total_price"] == 0:
            return data

        reservation_unit = self.instance.reservation_unit
        reservation_unit.validators.validate_has_payment_type()
        payment_type = PaymentType(reservation_unit.payment_type)

        begin = self.instance.begins_at.astimezone(DEFAULT_TIMEZONE)
        now = local_datetime()
        three_days_from_now = now + datetime.timedelta(days=3)
        one_hour_before_begin = begin.astimezone(datetime.UTC) - datetime.timedelta(hours=1)
        time_until_begin = datetime_difference(start_datetime=now, end_datetime=begin)
        data["handled_payment_due_by"] = min(three_days_from_now, one_hour_before_begin)

        # Use on-site payment if the reservation is going to begin soon,
        # even if the payment type of the reservation unit is not on-site.
        if time_until_begin < datetime.timedelta(hours=2):
            data["payment_type"] = PaymentType.ON_SITE
            return data

        if payment_type != PaymentType.ON_SITE:
            reservation_unit.validators.validate_has_payment_product()

        data["payment_type"] = payment_type
        return data

    def update(self, instance: Reservation, validated_data: ReservationApproveData) -> Reservation:
        price_line_overrides = validated_data.pop("price_line_overrides")
        validated_data.pop("new_total_price")

        with transaction.atomic():
            # The payment order gets its amounts from the totals that the overrides set.
            self.save_price_line_overrides(price_line_overrides)

            # A webshop payment uses the tax rates of the date of sale.
            # Other payments keep the tax rates from the date the reservation was created.
            if validated_data.get("payment_type") in PaymentType.requires_verkkokauppa:
                set_price_line_taxes(reservation=self.instance, on_date=local_date())

            if settings.PAYMENT_ORDERS_FOR_HANDLED_RESERVATIONS_ENABLED:
                self.create_payment_order_if_required(validated_data)

            instance = super().update(instance=instance, validated_data=validated_data)

        if instance.access_type == AccessType.ACCESS_CODE:
            # Allow activation in Pindora to fail, will be handled by a background task.
            try:
                try:
                    PindoraService.activate_access_code(instance)
                except PindoraNotFoundError:
                    # If access code has not been generated (e.g. returned to handling after a deny and then approved),
                    # create a new active access code in Pindora.
                    PindoraService.create_access_code(instance, is_active=True)

            except ExternalServiceError as error:
                SentryLogger.log_exception(error, details=f"Reservation: {instance.pk}")

        if (
            settings.PAYMENT_ORDERS_FOR_HANDLED_RESERVATIONS_ENABLED
            and instance.is_handled_paid
            and instance.payment_order.status not in OrderStatus.paid_in_webshop
        ):
            EmailService.send_reservation_requires_payment_email(reservation=instance)
        else:
            EmailService.send_reservation_confirmed_email(reservation=instance)

        EmailService.send_reservation_created_staff_notification_email(reservation=instance)

        return instance

    def save_price_line_overrides(self, price_line_overrides: dict[int, Decimal | None]) -> None:
        price_lines: list[ReservationPriceLine] = list(self.instance.price_lines.all())
        for line in price_lines:
            line.override_amount = price_line_overrides[line.pk]

        ReservationPriceLine.objects.bulk_update(price_lines, fields=["override_amount"])

    def create_payment_order_if_required(self, validated_data: ReservationApproveData) -> None:
        # Delete any non-paid/refunded payment order
        if validated_data["should_delete_previous_payment_order"]:
            self.instance.payment_order.delete()
            self.instance.refresh_from_db()

        if self.instance.total_price == 0:
            return

        # If a payment order still exists, it should be paid and have the same price, so don't create a new one.
        if hasattr(self.instance, "payment_order"):
            return

        if validated_data["state"].should_create_payment_order:
            self.instance.actions.create_payment_order_paid_after_handling(
                payment_type=validated_data["payment_type"],
                handled_payment_due_by=validated_data["handled_payment_due_by"],
            )
