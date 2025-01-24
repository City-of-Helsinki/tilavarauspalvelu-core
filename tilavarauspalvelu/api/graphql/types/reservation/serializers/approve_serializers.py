from __future__ import annotations

from contextlib import suppress
from typing import TYPE_CHECKING

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from rest_framework.fields import IntegerField

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.models import Reservation
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import ReservationApproveData

__all__ = [
    "ReservationApproveSerializer",
]


class ReservationApproveSerializer(NestingModelSerializer):
    """Approve a reservation during handling."""

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
            "price",
            "handling_details",
            "handled_at",
            "state",
        ]
        extra_kwargs = {
            "price": {"required": True},
            "handling_details": {"required": True},
            "handled_at": {"read_only": True},
        }

    def validate(self, data: ReservationApproveData) -> ReservationApproveData:
        self.instance.validator.validate_reservation_state_allows_approving()
        data["state"] = ReservationStateChoice.CONFIRMED
        data["handled_at"] = local_datetime()
        return data

    def update(self, instance: Reservation, validated_data: ReservationApproveData) -> Reservation:
        instance = super().update(instance=instance, validated_data=validated_data)

        if self.instance.access_type == AccessType.ACCESS_CODE:
            # Allow activation in Pindora to fail, will be handled by a background task.
            with suppress(Exception):
                PindoraClient.activate_reservation_access_code(reservation=instance)
                instance.access_code_is_active = True
                instance.save(update_fields=["access_code_is_active"])

        EmailService.send_reservation_approved_email(reservation=instance)
        EmailService.send_staff_notification_reservation_made_email(reservation=instance)
        return instance
