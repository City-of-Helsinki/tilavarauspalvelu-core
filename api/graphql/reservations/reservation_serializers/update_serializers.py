import datetime

from django.utils.timezone import get_default_timezone
from graphene.utils.str_converters import to_camel_case

from api.graphql.base_serializers import PrimaryKeyUpdateSerializer
from api.graphql.reservations.reservation_serializers.create_serializers import (
    ReservationCreateSerializer,
)
from api.graphql.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from applications.models import CUSTOMER_TYPES
from reservations.models import STATE_CHOICES

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationUpdateSerializer(PrimaryKeyUpdateSerializer, ReservationCreateSerializer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["state"].read_only = False
        self.fields["state"].required = False
        self.fields["state"].help_text = (
            "String value for ReservationType's ReservationState enum. "
            + f"Possible values are {', '.join(value[0].upper() for value in STATE_CHOICES.STATE_CHOICES)}."
        )
        self.fields["reservee_first_name"].required = False
        self.fields["reservee_last_name"].required = False
        self.fields["reservee_phone"].required = False
        self.fields["reservee_language"].required = False
        self.fields["name"].required = False
        self.fields["description"].required = False
        self.fields["priority"].required = False
        self.fields["begin"].required = False
        self.fields["end"].required = False
        self.fields["buffer_time_before"].required = False
        self.fields["buffer_time_after"].required = False
        self.fields["reservation_unit_pks"].required = False
        self.fields["purpose_pk"].required = False

    def validate(self, data, prefill_from_profile=False):
        if self.instance.state not in (STATE_CHOICES.CREATED,):
            raise ValidationErrorWithCode(
                "Reservation cannot be changed anymore.",
                ValidationErrorCodes.CHANGES_NOT_ALLOWED,
            )

        new_state = data.get("state", self.instance.state)
        if new_state not in [STATE_CHOICES.CANCELLED, STATE_CHOICES.CREATED]:
            raise ValidationErrorWithCode(
                f"Setting the reservation state to {new_state} is not allowed.",
                ValidationErrorCodes.STATE_CHANGE_NOT_ALLOWED,
            )

        data = super().validate(data, prefill_from_profile)
        data["state"] = new_state

        reservation_units = data.get("reservation_unit", getattr(self.instance, "reservation_unit", None))
        if hasattr(reservation_units, "all"):
            reservation_units = reservation_units.all()

        for reservation_unit in reservation_units:
            self.check_metadata_fields(data, reservation_unit)

        # If the reservation as applying_for_free_of_charge True then we require free_of_charge_reason.
        if data.get("applying_for_free_of_charge", self.instance.applying_for_free_of_charge) and not data.get(
            "free_of_charge_reason", self.instance.free_of_charge_reason
        ):
            raise ValidationErrorWithCode(
                "Free of charge reason is mandatory when applying for free of charge.",
                ValidationErrorCodes.REQUIRES_REASON_FOR_APPLYING_FREE_OF_CHARGE,
            )

        return data

    @property
    def validated_data(self):
        validated_data = super().validated_data
        validated_data["user"] = self.instance.user  # Do not change the user.
        validated_data["confirmed_at"] = datetime.datetime.now().astimezone(DEFAULT_TIMEZONE)
        return validated_data

    def check_metadata_fields(self, data, reservation_unit) -> None:
        # Even marked in the metadata set to be mandatory, yet these never should be for private person.
        non_mandatory_fields_for_person = [
            "reservee_organisation_name",
            "home_city",
            "reservee_id",
        ]

        metadata_set = reservation_unit.metadata_set
        required_fields = metadata_set.required_fields.all() if metadata_set else []

        reservee_type = data.get("reservee_type", getattr(self.instance, "reservee_type", None))
        if required_fields and reservee_type == CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL:
            required_fields = metadata_set.required_fields.exclude(field_name__in=non_mandatory_fields_for_person)

        for required_field in required_fields:
            internal_field_name = required_field.field_name
            existing_value = getattr(self.instance, internal_field_name, None)

            # If the reservee_is_unregistered_association is True it's not mandatory to give reservee_id
            # even if in metadataset says so.
            unregistered_field_name = "reservee_is_unregistered_association"
            if internal_field_name == "reservee_id" and data.get(
                unregistered_field_name,
                getattr(self.instance, unregistered_field_name, None),
            ):
                continue

            if not data.get(internal_field_name, existing_value):
                raise ValidationErrorWithCode(
                    f"Value for required field {to_camel_case(internal_field_name)} is missing.",
                    ValidationErrorCodes.REQUIRED_FIELD_MISSING,
                    to_camel_case(internal_field_name),
                )
