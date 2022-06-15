from enum import Enum


class ReservationUnitState(Enum):
    DRAFT = "draft"
    SCHEDULED_PUBLISHING = "scheduledPublishing"
    SCHEDULED_RESERVATION = "scheduledReservation"
    PUBLISHED = "published"
    ARCHIVED = "archived"

    def __str__(self):
        return self.value
