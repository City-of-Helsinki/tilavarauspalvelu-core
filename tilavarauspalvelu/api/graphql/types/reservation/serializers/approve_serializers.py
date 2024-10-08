from typing import Any

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.utils.email.reservation_email_notification_sender import ReservationEmailNotificationSender
from utils.date_utils import local_datetime

__all__ = [
    "ReservationApproveSerializer",
]


class ReservationApproveSerializer(NestingModelSerializer):
    instance: Reservation

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
            "state",
            "handled_at",
        ]
        extra_kwargs = {
            "handled_at": {"read_only": True},
            "handling_details": {"required": True},
            "price": {"required": True},
        }

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        if self.instance.state != ReservationStateChoice.REQUIRES_HANDLING:
            msg = "Only reservations with state 'REQUIRES_HANDLING' can be approved."
            raise ValidationError(msg, code=error_codes.RESERVATION_APPROVING_NOT_ALLOWED)

        return data

    def save(self, **kwargs: Any) -> Reservation:
        kwargs["state"] = ReservationStateChoice.CONFIRMED.value
        kwargs["handled_at"] = local_datetime()
        instance = super().save(**kwargs)
        ReservationEmailNotificationSender.send_approve_email(reservation=instance)
        return instance
