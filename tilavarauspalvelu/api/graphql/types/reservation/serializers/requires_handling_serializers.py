from __future__ import annotations

from typing import Any, NotRequired, TypedDict

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from rest_framework.fields import IntegerField

from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.models import Reservation

__all__ = [
    "ReservationRequiresHandlingSerializer",
]


class ReservationHandlingData(TypedDict):
    pk: int

    state: NotRequired[ReservationStateChoice]


class ReservationRequiresHandlingSerializer(NestingModelSerializer):
    """Return a reservation to handling."""

    instance: Reservation

    pk = IntegerField(required=True)

    state = EnumFriendlyChoiceField(
        choices=ReservationStateChoice.choices,
        enum=ReservationStateChoice,
        read_only=True,
    )

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "state",
        ]

    def validate(self, data: ReservationHandlingData) -> ReservationHandlingData:
        self.instance.validator.validate_reservation_state_allows_handling()
        data["state"] = ReservationStateChoice.REQUIRES_HANDLING
        return data

    def update(self, instance: Reservation, validated_data: dict[str, Any]) -> Reservation:
        instance = super().update(instance=instance, validated_data=validated_data)
        EmailService.send_reservation_requires_handling_email(reservation=instance)
        return instance
