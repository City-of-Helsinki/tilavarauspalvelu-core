from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

from django.conf import settings
from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from rest_framework.exceptions import ValidationError
from rest_framework.fields import IntegerField

from tilavarauspalvelu.enums import AccessType, OrderStatus, PaymentType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import ReservationApproveData

__all__ = [
    "ReservationApproveSerializer",
]


class ReservationApproveSerializer(NestingModelSerializer):
    """Approve a reservation during handling."""

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
            "price",
            "handling_details",
            "handled_at",
            "state",
        ]
        extra_kwargs = {
            "price": {"required": True},
            "handling_details": {"required": True},
            "handled_at": {"read_only": True},
        }

    def validate(self, data: ReservationApproveData) -> ReservationApproveData:
        self.instance.validators.validate_reservation_state_allows_approving()
        data["state"] = ReservationStateChoice.CONFIRMED
        data["handled_at"] = local_datetime()

        if data["price"] == 0:
            return data

        if settings.PAYMENT_ORDERS_FOR_HANDLED_RESERVATIONS_ENABLED:
            return self.validate_payment_order(data)

        return data

    def validate_payment_order(self, data: ReservationApproveData) -> ReservationApproveData:
        data["should_delete_previous_payment_order"] = False

        # In case reservation is approved -> set back to handled -> approved, there might be a payment order already
        if hasattr(self.instance, "payment_order"):
            payment_order = self.instance.payment_order

            paid_in_webshop = payment_order.status in OrderStatus.paid_in_webshop
            data["should_delete_previous_payment_order"] = not paid_in_webshop

            if paid_in_webshop:
                if payment_order.price_total != data["price"]:
                    msg = "Reservation already has a paid payment order with a different price."
                    raise ValidationError(msg, code=error_codes.RESERVATION_PRICE_CANNOT_BE_CHANGED)

                # If price hasn't changed, we can just use the existing payment order.
                return data

        reservation_unit = self.instance.reservation_unit
        begin = self.instance.begins_at.astimezone(DEFAULT_TIMEZONE)

        pricing = reservation_unit.actions.get_active_pricing(by_date=begin.date())
        if pricing is None:
            msg = "No pricing found for reservation's begin date."
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_NO_ACTIVE_PRICING)

        # Tax percentage needs to be updated in case it has changed since the reservation was created
        data["tax_percentage_value"] = pricing.tax_percentage.value

        three_days_from_now = local_datetime() + datetime.timedelta(days=3)
        one_hour_before_begin = begin - datetime.timedelta(hours=1)
        data["handled_payment_due_by"] = min(three_days_from_now, one_hour_before_begin)

        # Use on-site payment if the reservation is going to begin soon,
        # even if the current pricing payment type is not on-site.
        if begin - local_datetime() < datetime.timedelta(hours=2):
            data["payment_type"] = PaymentType.ON_SITE
            return data

        if pricing.payment_type != PaymentType.ON_SITE:
            reservation_unit.validators.validate_has_payment_product()

        data["payment_type"] = PaymentType(pricing.payment_type)
        return data

    def update(self, instance: Reservation, validated_data: ReservationApproveData) -> Reservation:
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

        if settings.PAYMENT_ORDERS_FOR_HANDLED_RESERVATIONS_ENABLED and instance.is_handled_paid:
            EmailService.send_reservation_requires_payment_email(reservation=instance)
        else:
            EmailService.send_reservation_approved_email(reservation=instance)

        EmailService.send_reservation_confirmed_staff_notification_email(reservation=instance)

        return instance

    def create_payment_order_if_required(self, validated_data: ReservationApproveData) -> None:
        if validated_data["price"] == 0:
            return

        # Delete any non-paid/refunded payment order
        if validated_data["should_delete_previous_payment_order"]:
            self.instance.payment_order.delete()
            self.instance.refresh_from_db()

        # If a payment order still exists, it should be paid and have the same price, so don't create a new one.
        if hasattr(self.instance, "payment_order"):
            return

        # Set price info on instance early so that payment order data is calculated correctly
        self.instance.price = validated_data["price"]
        self.instance.tax_percentage_value = validated_data["tax_percentage_value"]

        if validated_data["state"].should_create_payment_order:
            self.instance.actions.create_payment_order_paid_after_handling(
                payment_type=validated_data["payment_type"],
                handled_payment_due_by=validated_data["handled_payment_due_by"],
            )
