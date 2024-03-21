from rest_framework import serializers

from api.graphql.extensions.decimal_field import DecimalField
from api.graphql.extensions.legacy_helpers import OldPrimaryKeySerializer
from api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from common.date_utils import local_datetime
from email_notification.helpers.reservation_email_notification_sender import ReservationEmailNotificationSender
from reservations.choices import ReservationStateChoice
from reservations.models import Reservation


class ReservationApproveSerializer(OldPrimaryKeySerializer):
    handling_details = serializers.CharField(
        help_text="Additional information for approval.",
        required=False,
        allow_blank=True,
    )
    price = DecimalField()
    price_net = DecimalField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["state"].read_only = True
        self.fields["handled_at"].read_only = True
        self.fields["price"].required = True
        self.fields["price_net"].required = True
        self.fields["handling_details"].required = True

    class Meta:
        model = Reservation
        fields = ["pk", "state", "handling_details", "handled_at", "price", "price_net"]

    @property
    def validated_data(self):
        validated_data = super().validated_data
        validated_data["state"] = ReservationStateChoice.CONFIRMED.value
        validated_data["handled_at"] = local_datetime()

        return validated_data

    def validate(self, data):
        if self.instance.state != ReservationStateChoice.REQUIRES_HANDLING.value:
            raise ValidationErrorWithCode(
                f"Only reservations with state as {ReservationStateChoice.REQUIRES_HANDLING.value.upper()} "
                f"can be approved.",
                ValidationErrorCodes.APPROVING_NOT_ALLOWED,
            )

        data = super().validate(data)

        return data

    def save(self, **kwargs):
        instance = super().save(**kwargs)
        ReservationEmailNotificationSender.send_approve_email(reservation=instance)
        return instance
