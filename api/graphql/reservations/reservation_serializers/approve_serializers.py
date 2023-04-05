import datetime

from django.utils.timezone import get_default_timezone
from rest_framework import serializers

from api.graphql.base_serializers import PrimaryKeySerializer
from api.graphql.decimal_field import DecimalField
from api.graphql.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from reservations.email_utils import send_approve_email
from reservations.models import STATE_CHOICES, Reservation

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationApproveSerializer(PrimaryKeySerializer):
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
        validated_data["state"] = STATE_CHOICES.CONFIRMED
        validated_data["handled_at"] = datetime.datetime.now(tz=DEFAULT_TIMEZONE)

        return validated_data

    def validate(self, data):
        if self.instance.state != STATE_CHOICES.REQUIRES_HANDLING:
            raise ValidationErrorWithCode(
                f"Only reservations with state as {STATE_CHOICES.REQUIRES_HANDLING.upper()} can be approved.",
                ValidationErrorCodes.APPROVING_NOT_ALLOWED,
            )

        data = super().validate(data)

        return data

    def save(self, **kwargs):
        instance = super().save(**kwargs)
        send_approve_email(instance)
        return instance
