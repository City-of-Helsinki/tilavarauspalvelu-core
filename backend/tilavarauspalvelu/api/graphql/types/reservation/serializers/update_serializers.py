from __future__ import annotations

from typing import TYPE_CHECKING

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField, IntegerPrimaryKeyField
from rest_framework.fields import IntegerField

from tilavarauspalvelu.enums import CustomerTypeChoice, ReservationStateChoice
from tilavarauspalvelu.models import AgeGroup, City, Reservation, ReservationPurpose

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import ReservationUpdateData


class ReservationUpdateSerializer(NestingModelSerializer):
    """Update reservation from form fields specific to the reservation unit."""

    instance: Reservation

    pk = IntegerField(required=True)

    reservee_type = EnumFriendlyChoiceField(
        choices=CustomerTypeChoice.choices,
        enum=CustomerTypeChoice,
        required=False,
    )

    purpose = IntegerPrimaryKeyField(queryset=ReservationPurpose.objects, allow_null=True, required=False)
    home_city = IntegerPrimaryKeyField(queryset=City.objects, allow_null=True, required=False)
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
            #
            # Free of charge information
            "applying_for_free_of_charge",
            "free_of_charge_reason",
            #
            # Reservee information
            "reservee_id",
            "reservee_first_name",
            "reservee_last_name",
            "reservee_email",
            "reservee_phone",
            "reservee_organisation_name",
            "reservee_address_street",
            "reservee_address_city",
            "reservee_address_zip",
            "reservee_is_unregistered_association",
            "reservee_type",
            #
            # Billing information
            "billing_first_name",
            "billing_last_name",
            "billing_email",
            "billing_phone",
            "billing_address_street",
            "billing_address_city",
            "billing_address_zip",
            #
            # Relations
            "age_group",
            "home_city",
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
