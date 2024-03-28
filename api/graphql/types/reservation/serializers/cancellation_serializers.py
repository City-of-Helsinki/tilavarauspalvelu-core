from rest_framework import serializers

from api.graphql.extensions.serializers import OldPrimaryKeyUpdateSerializer
from api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from common.date_utils import local_datetime
from common.fields.serializer import IntegerPrimaryKeyField
from email_notification.helpers.reservation_email_notification_sender import ReservationEmailNotificationSender
from merchants.models import OrderStatus, PaymentOrder
from reservations.choices import ReservationStateChoice
from reservations.models import Reservation, ReservationCancelReason
from reservations.tasks import refund_paid_reservation_task


class ReservationCancellationSerializer(OldPrimaryKeyUpdateSerializer):
    cancel_reason_pk = IntegerPrimaryKeyField(
        queryset=ReservationCancelReason.objects.all(),
        source="cancel_reason",
        required=True,
        help_text="Primary key for the pre-defined cancel reason.",
    )
    cancel_details = serializers.CharField(
        help_text="Additional information for the cancellation.",
        required=False,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["state"].read_only = True

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "cancel_reason_pk",
            "cancel_details",
            "state",
        ]

    @property
    def validated_data(self):
        validated_data = super().validated_data
        validated_data["state"] = ReservationStateChoice.CANCELLED.value
        return validated_data

    def validate(self, data):
        data = super().validate(data)
        if self.instance.state != ReservationStateChoice.CONFIRMED.value:
            raise ValidationErrorWithCode(
                "Only reservations in confirmed state can be cancelled through this.",
                ValidationErrorCodes.CANCELLATION_NOT_ALLOWED,
            )

        now = local_datetime()
        if self.instance.begin < now:
            ValidationErrorWithCode(
                "Reservation cannot be cancelled when begin time is in past.",
                ValidationErrorCodes.CANCELLATION_NOT_ALLOWED,
            )
        for reservation_unit in self.instance.reservation_unit.all():
            cancel_rule = reservation_unit.cancellation_rule
            if not cancel_rule:
                raise ValidationErrorWithCode(
                    "Reservation cannot be cancelled thus no cancellation rule.",
                    ValidationErrorCodes.CANCELLATION_NOT_ALLOWED,
                )
            must_be_cancelled_before = self.instance.begin - cancel_rule.can_be_cancelled_time_before
            if must_be_cancelled_before < now:
                raise ValidationErrorWithCode(
                    "Reservation cannot be cancelled because the cancellation period has expired.",
                    ValidationErrorCodes.CANCELLATION_NOT_ALLOWED,
                )
            if cancel_rule.needs_handling:
                raise ValidationErrorWithCode(
                    "Reservation cancellation needs manual handling.",
                    ValidationErrorCodes.REQUIRES_MANUAL_HANDLING,
                )

        return data

    def save(self, **kwargs):
        instance = super().save(**kwargs)

        payment_order = PaymentOrder.objects.filter(reservation=self.instance).first()
        payment_is_refundable = (
            payment_order and payment_order.status == OrderStatus.PAID and not payment_order.refund_id
        )

        if payment_is_refundable and self.instance.price_net > 0:
            refund_paid_reservation_task.delay(self.instance.pk)

        ReservationEmailNotificationSender.send_cancellation_email(reservation=instance)
        return instance
