from api.graphql.base_serializers import PrimaryKeySerializer
from api.graphql.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from reservations.email_utils import send_requires_handling_email
from reservations.models import STATE_CHOICES, Reservation


class ReservationRequiresHandlingSerializer(PrimaryKeySerializer):
    class Meta:
        model = Reservation
        fields = [
            "pk",
            "state",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["state"].read_only = True

    @property
    def validated_data(self):
        validated_data = super().validated_data
        validated_data["state"] = STATE_CHOICES.REQUIRES_HANDLING
        return validated_data

    def validate(self, data):
        if self.instance.state not in (STATE_CHOICES.DENIED, STATE_CHOICES.CONFIRMED):
            raise ValidationErrorWithCode(
                f"Only reservations with states {STATE_CHOICES.DENIED.upper()} and {STATE_CHOICES.CONFIRMED.upper()} "
                f"can be reverted to requires handling.",
                ValidationErrorCodes.STATE_CHANGE_NOT_ALLOWED,
            )
        data = super().validate(data)
        return data

    def save(self, **kwargs):
        instance = super().save(**kwargs)
        send_requires_handling_email(instance)
        return instance
