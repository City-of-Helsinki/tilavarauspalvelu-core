from typing import Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework.exceptions import ValidationError

from api.graphql.extensions import error_codes
from common.date_utils import local_datetime
from email_notification.helpers.reservation_email_notification_sender import ReservationEmailNotificationSender
from reservations.choices import ReservationStateChoice
from reservations.models import Reservation

__all__ = [
    "ReservationApproveSerializer",
]


class ReservationApproveSerializer(NestingModelSerializer):
    instance: Reservation

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "price",
            "price_net",
            "handling_details",
            "state",
            "handled_at",
        ]
        extra_kwargs = {
            "state": {"read_only": True},
            "handled_at": {"read_only": True},
            "handling_details": {"required": True},
            "price": {"required": True},
            "price_net": {"required": True},
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
