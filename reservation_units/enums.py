from enum import Enum

from django.db.models import TextChoices
from django.utils.translation import gettext_lazy as _


class ReservationUnitState(Enum):
    DRAFT = "DRAFT"
    SCHEDULED_PUBLISHING = "SCHEDULED_PUBLISHING"
    SCHEDULED_HIDING = "SCHEDULED_HIDING"
    SCHEDULED_PERIOD = "SCHEDULED_PERIOD"
    HIDDEN = "HIDDEN"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class ReservationState(Enum):
    SCHEDULED_RESERVATION = "SCHEDULED_RESERVATION"
    SCHEDULED_PERIOD = "SCHEDULED_PERIOD"
    RESERVABLE = "RESERVABLE"
    SCHEDULED_CLOSING = "SCHEDULED_CLOSING"
    RESERVATION_CLOSED = "RESERVATION_CLOSED"


class ReservationStartInterval(TextChoices):
    INTERVAL_15_MINUTES = "interval_15_mins", _("15 minutes")
    INTERVAL_30_MINUTES = "interval_30_mins", _("30 minutes")
    INTERVAL_60_MINUTES = "interval_60_mins", _("60 minutes")
    INTERVAL_90_MINUTES = "interval_90_mins", _("90 minutes")

    @property
    def as_number(self) -> int:
        return int(self.value.split("_")[1])
