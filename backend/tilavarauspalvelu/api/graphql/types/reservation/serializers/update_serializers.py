from __future__ import annotations

from typing import TYPE_CHECKING

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField, IntegerPrimaryKeyField
from rest_framework.fields import IntegerField

from tilavarauspalvelu.enums import MunicipalityChoice, ReservationStateChoice, ReserveeType
from tilavarauspalvelu.models import AgeGroup, Reservation, ReservationPurpose

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import ReservationUpdateData


class ReservationUpdateSerializer(NestingModelSerializer):
    """Update reservation from form fields specific to the reservation unit."""

    instance: Reservation

    pk = IntegerField(required=True)

    reservee_type = EnumFriendlyChoiceField(
        choices=ReserveeType.choices,
        enum=ReserveeType,
        required=False,
    )
    municipality = EnumFriendlyChoiceField(
        choices=MunicipalityChoice.choices,
        enum=MunicipalityChoice,
        allow_null=True,
        default=None,
        required=False,
    )

    purpose = IntegerPrimaryKeyField(queryset=ReservationPurpose.objects, allow_null=True, required=False)
    age_group = IntegerPrimaryKeyField(queryset=AgeGroup.objects, allow_null=True, required=False)

    state = EnumFriendlyChoiceField(
        choices=ReservationStateChoice.choices,
        enum=ReservationStateChoice,
        read_only=True,
    )

    class Meta:
        model = Reservation
        fields = [
            "pk",
            #
            # Basic information
            "name",
            "description",
            "num_persons",
            "municipality",
            #
            # Free of charge information
            "applying_for_free_of_charge",
            "free_of_charge_reason",
            #
            # Reservee information
            "reservee_identifier",
            "reservee_first_name",
            "reservee_last_name",
            "reservee_email",
            "reservee_phone",
            "reservee_organisation_name",
            "reservee_address_street",
            "reservee_address_city",
            "reservee_address_zip",
            "reservee_type",
            #
            # Relations
            "age_group",
            "purpose",
            #
            # Read only
            "state",
        ]

    def validate(self, data: ReservationUpdateData) -> ReservationUpdateData:
        self.instance.validators.validate_can_change_reservation()
        self.instance.validators.validate_free_of_charge_arguments(**data)
        self.instance.validators.validate_required_metadata_fields(**data)
        return data
