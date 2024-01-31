from api.graphql.extensions.legacy_helpers import OldPrimaryKeySerializer
from api.graphql.extensions.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from reservations.choices import ReservationStateChoice
from reservations.models import Reservation


class ReservationRequiresHandlingSerializer(OldPrimaryKeySerializer):
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
        validated_data["state"] = ReservationStateChoice.REQUIRES_HANDLING.value
        return validated_data

    def validate(self, data):
        valid_states = [ReservationStateChoice.DENIED.value, ReservationStateChoice.CONFIRMED.value]
        if self.instance.state not in valid_states:
            raise ValidationErrorWithCode(
                f"Only reservations with states {' and '.join(valid_states)} can be reverted to requires handling.",
                ValidationErrorCodes.STATE_CHANGE_NOT_ALLOWED,
            )
        data = super().validate(data)
        return data

    def save(self, **kwargs):
        instance = super().save(**kwargs)
        instance.actions.send_requires_handling_email()
        return instance
