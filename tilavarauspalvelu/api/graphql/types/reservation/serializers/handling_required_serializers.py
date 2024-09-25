from typing import Any

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from rest_framework.exceptions import ValidationError

from common.utils import comma_sep_str
from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.utils.email.reservation_email_notification_sender import ReservationEmailNotificationSender

__all__ = [
    "ReservationRequiresHandlingSerializer",
]


class ReservationRequiresHandlingSerializer(NestingModelSerializer):
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
            "state",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        if self.instance.state not in ReservationStateChoice.states_that_can_change_to_handling:
            states = comma_sep_str(ReservationStateChoice.states_that_can_change_to_handling, last_sep="or", quote=True)
            msg = f"Only reservations with states {states} can be returned to handling."
            raise ValidationError(msg, code=error_codes.RESERVATION_STATE_CHANGE_NOT_ALLOWED)

        return data

    def save(self, **kwargs: Any) -> Reservation:
        kwargs["state"] = ReservationStateChoice.REQUIRES_HANDLING.value
        instance = super().save(**kwargs)
        ReservationEmailNotificationSender.send_requires_handling_email(reservation=instance)
        return instance
