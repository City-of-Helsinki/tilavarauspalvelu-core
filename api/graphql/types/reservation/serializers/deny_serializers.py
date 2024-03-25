from rest_framework import serializers

from api.graphql.extensions.serializers import OldPrimaryKeySerializer
from api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from common.date_utils import local_datetime
from common.fields.serializer import IntegerPrimaryKeyField
from email_notification.helpers.reservation_email_notification_sender import ReservationEmailNotificationSender
from reservations.choices import ReservationStateChoice, ReservationTypeChoice
from reservations.models import Reservation, ReservationDenyReason


class ReservationDenySerializer(OldPrimaryKeySerializer):
    deny_reason_pk = IntegerPrimaryKeyField(
        queryset=ReservationDenyReason.objects.all(),
        source="deny_reason",
        required=True,
        help_text="Primary key for the pre-defined deny reason.",
    )

    handling_details = serializers.CharField(
        help_text="Additional information for denying.",
        required=False,
        allow_blank=True,
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["state"].read_only = True
        self.fields["handled_at"].read_only = True

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "state",
            "handling_details",
            "handled_at",
            "deny_reason_pk",
        ]

    @property
    def validated_data(self):
        validated_data = super().validated_data
        validated_data["state"] = ReservationStateChoice.DENIED.value
        validated_data["handled_at"] = local_datetime()

        return validated_data

    def validate(self, data):
        allowed_states = [ReservationStateChoice.REQUIRES_HANDLING.value, ReservationStateChoice.CONFIRMED.value]

        if self.instance.state not in allowed_states:
            raise ValidationErrorWithCode(
                f"Only reservations with state as {', '.join(allowed_states)} can be denied.",
                ValidationErrorCodes.DENYING_NOT_ALLOWED,
            )

        # For confirmed reservations check that the reservation has not ended.
        if self.instance.state == ReservationStateChoice.CONFIRMED.value:
            self.check_reservation_has_not_ended()

        data = super().validate(data)

        return data

    def check_reservation_has_not_ended(self):
        now = local_datetime()

        if self.instance.end < now:
            raise ValidationErrorWithCode(
                "Reservation cannot be denied when the reservation has ended.",
                ValidationErrorCodes.DENYING_NOT_ALLOWED,
            )

    def save(self, **kwargs):
        instance = super().save(**kwargs)
        now = local_datetime()

        # Send the notification email only for normal reservations which has not ended.
        if instance.type == ReservationTypeChoice.NORMAL and instance.end > now:
            ReservationEmailNotificationSender.send_deny_email(reservation=instance)

        return instance
