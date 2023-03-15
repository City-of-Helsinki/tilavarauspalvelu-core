import datetime

from django.utils.timezone import get_default_timezone
from rest_framework import serializers

from api.graphql.base_serializers import PrimaryKeySerializer
from api.graphql.primary_key_fields import IntegerPrimaryKeyField
from api.graphql.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from reservations.email_utils import send_deny_email
from reservations.models import STATE_CHOICES, Reservation, ReservationDenyReason

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationDenySerializer(PrimaryKeySerializer):
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
        validated_data["state"] = STATE_CHOICES.DENIED
        validated_data["handled_at"] = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        # For now, we want to copy the handling details to working memo. In future perhaps not.
        validated_data["working_memo"] = validated_data["handling_details"]
        return validated_data

    def validate(self, data):
        if self.instance.state != STATE_CHOICES.REQUIRES_HANDLING:
            raise ValidationErrorWithCode(
                f"Only reservations with state as {STATE_CHOICES.REQUIRES_HANDLING.upper()} can be denied.",
                ValidationErrorCodes.DENYING_NOT_ALLOWED,
            )
        data = super().validate(data)

        return data

    def save(self, **kwargs):
        instance = super().save(**kwargs)
        send_deny_email(instance)
        return instance
