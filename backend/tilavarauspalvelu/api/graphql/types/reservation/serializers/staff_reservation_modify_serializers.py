from __future__ import annotations

from typing import TYPE_CHECKING

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField, IntegerPrimaryKeyField
from rest_framework.fields import IntegerField

from tilavarauspalvelu.enums import (
    AccessType,
    MunicipalityChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
    ReserveeType,
)
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import AgeGroup, Reservation, ReservationPurpose
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import StaffReservationData


class StaffReservationModifySerializer(NestingModelSerializer):
    instance: Reservation

    pk = IntegerField(required=True)

    reservee_type = EnumFriendlyChoiceField(
        choices=ReserveeType.choices,
        enum=ReserveeType,
        required=False,
    )
    type = EnumFriendlyChoiceField(
        choices=ReservationTypeChoice.choices,
        enum=ReservationTypeChoice,
        required=False,
    )
    municipality = EnumFriendlyChoiceField(
        choices=MunicipalityChoice.choices,
        enum=MunicipalityChoice,
        allow_null=True,
        default=None,
        required=False,
    )

    age_group = IntegerPrimaryKeyField(queryset=AgeGroup.objects, required=False, allow_null=True)
    purpose = IntegerPrimaryKeyField(queryset=ReservationPurpose.objects, required=False, allow_null=True)

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
            "type",
            "municipality",
            #
            # Free of charge information
            "applying_for_free_of_charge",
            "free_of_charge_reason",
            #
            # Price information
            #
            # Reservee information
            "reservee_first_name",
            "reservee_last_name",
            "reservee_phone",
            "reservee_organisation_name",
            "reservee_address_street",
            "reservee_address_city",
            "reservee_address_zip",
            "reservee_email",
            "reservee_type",
            "reservee_identifier",
            #
            # Relations
            "age_group",
            "purpose",
            #
            # Read only
            "confirmed_at",
            "state",
            # Time info
            "begins_at",
            "ends_at",
            "buffer_time_after",
            "buffer_time_before",
            # Price info
            "price",
            "price_net",
            "non_subsidised_price",
            "non_subsidised_price_net",
            "tax_percentage_value",
            "unit_price",
        ]
        extra_kwargs = {
            "confirmed_at": {"read_only": True},
            # Time info
            "begins_at": {"read_only": True},
            "ends_at": {"read_only": True},
            "buffer_time_after": {"read_only": True},
            "buffer_time_before": {"read_only": True},
            # Price info
            "price": {"read_only": True},
            "price_net": {"read_only": True},
            "non_subsidised_price": {"read_only": True},
            "non_subsidised_price_net": {"read_only": True},
            "tax_percentage_value": {"read_only": True},
            "unit_price": {"read_only": True},
        }

    def validate(self, data: StaffReservationData) -> StaffReservationData:
        self.instance.validators.validate_reservation_state_allows_staff_edit()
        self.instance.validators.validate_reservation_can_be_modified_by_staff()

        reservation_type = data.get("type")
        if reservation_type is not None:
            self.instance.validators.validate_reservation_type_allows_staff_edit(new_type=reservation_type)

        return data

    def update(self, instance: Reservation, validated_data: StaffReservationData) -> Reservation:
        type_before = instance.type
        type_after = validated_data.get("type", type_before)

        # If reservation was changed to or from blocked, change access code active state in Pindora.
        changed_with_blocked = type_before != type_after and ReservationTypeChoice.BLOCKED in {type_before, type_after}

        instance = super().update(instance=instance, validated_data=validated_data)

        if instance.access_type == AccessType.ACCESS_CODE and changed_with_blocked:
            # Allow mutation to succeed even if Pindora request fails.
            try:
                if type_after == ReservationTypeChoice.BLOCKED:
                    PindoraService.deactivate_access_code(obj=instance)
                else:
                    PindoraService.activate_access_code(obj=instance)
            except ExternalServiceError as error:
                SentryLogger.log_exception(error, details=f"Reservation: {instance.pk}")

        return instance
