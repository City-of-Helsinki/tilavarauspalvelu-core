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
        if self.instance.access_type == AccessType.ACCESS_CODE:
            # Allow activation in Pindora to fail, will be handled by a background task.
            with suppress(Exception):
                # If access code has not been generated (e.g. returned to handling after a deny and then approved),
                # create a new active access code in Pindora.
                if instance.access_code_generated_at is None:
                    response = PindoraClient.create_reservation(reservation=instance, is_active=True)
                    validated_data["access_code_generated_at"] = response["access_code_generated_at"]
                    validated_data["access_code_is_active"] = response["access_code_is_active"]

                else:
                    PindoraClient.activate_reservation_access_code(reservation=instance)
                    validated_data["access_code_is_active"] = True

        instance = super().update(instance=instance, validated_data=validated_data)

        EmailService.send_reservation_approved_email(reservation=instance)
        EmailService.send_staff_notification_reservation_made_email(reservation=instance)
        return instance
