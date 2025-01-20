from __future__ import annotations

from typing import TYPE_CHECKING

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField, IntegerPrimaryKeyField
from rest_framework.fields import CharField, IntegerField

from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.models import Reservation, ReservationDenyReason
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from django.db.models import Model

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

    def update(self, instance: Model, validated_data: ReservationDenyData) -> Model:
        instance = super().update(instance=instance, validated_data=validated_data)
        EmailService.send_reservation_rejected_email(reservation=instance)
        return instance
