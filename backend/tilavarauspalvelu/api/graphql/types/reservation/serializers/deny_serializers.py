from __future__ import annotations

from contextlib import suppress
from typing import TYPE_CHECKING

from django.db import transaction
from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField, IntegerPrimaryKeyField
from rest_framework.fields import CharField, IntegerField

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.models import Reservation, ReservationDenyReason
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import ReservationDenyData

__all__ = [
    "ReservationDenySerializer",
]


class ReservationDenySerializer(NestingModelSerializer):
    """Deny a reservation during handling."""

    instance: Reservation

    pk = IntegerField(required=True)

    deny_reason = IntegerPrimaryKeyField(queryset=ReservationDenyReason.objects, required=True)
    handling_details = CharField(required=True, allow_blank=True)

    state = EnumFriendlyChoiceField(
        choices=ReservationStateChoice.choices,
        enum=ReservationStateChoice,
        read_only=True,
    )

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "deny_reason",
            "handling_details",
            "state",
            "handled_at",
        ]
        extra_kwargs = {
            "handled_at": {"read_only": True},
        }

    def validate(self, data: ReservationDenyData) -> ReservationDenyData:
        self.instance.validator.validate_reservation_state_allows_denying()
        data["state"] = ReservationStateChoice.DENIED
        data["handled_at"] = local_datetime()
        return data

    def update(self, instance: Reservation, validated_data: ReservationDenyData) -> Reservation:
        with transaction.atomic():
            instance = super().update(instance=instance, validated_data=validated_data)

            if instance.access_type == AccessType.ACCESS_CODE:
                with suppress(PindoraNotFoundError):
                    PindoraService.delete_access_code(obj=instance)

        EmailService.send_reservation_rejected_email(reservation=instance)
        return instance
