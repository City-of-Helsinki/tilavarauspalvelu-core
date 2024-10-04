from typing import Any

from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.integrations.email.reservation_email_notification_sender import (
    ReservationEmailNotificationSender,
)
from tilavarauspalvelu.models import Reservation
from utils.date_utils import local_datetime
from utils.utils import comma_sep_str

__all__ = [
    "ReservationDenySerializer",
]


class ReservationDenySerializer(NestingModelSerializer):
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
            "deny_reason",
            "handling_details",
            "state",
            "handled_at",
        ]
        extra_kwargs = {
            "handled_at": {"read_only": True},
            "deny_reason": {"required": True},
            "handling_details": {"required": True},
        }

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        if self.instance.state not in ReservationStateChoice.states_that_can_change_to_deny:
            states = comma_sep_str(ReservationStateChoice.states_that_can_change_to_deny, last_sep="or", quote=True)
            msg = f"Only reservations with states {states} can be denied."
            raise ValidationError(msg, code=error_codes.RESERVATION_DENYING_NOT_ALLOWED)

        if self.instance.state == ReservationStateChoice.CONFIRMED:
            now = local_datetime()
            if self.instance.end < now:
                msg = "Reservation cannot be denied after it has ended."
                raise ValidationError(msg, code=error_codes.RESERVATION_DENYING_NOT_ALLOWED)

        return data

    def save(self, **kwargs: Any) -> Reservation:
        kwargs["state"] = ReservationStateChoice.DENIED.value
        kwargs["handled_at"] = local_datetime()
        instance = super().save(**kwargs)
        ReservationEmailNotificationSender.send_deny_email(reservation=instance)
        return instance
