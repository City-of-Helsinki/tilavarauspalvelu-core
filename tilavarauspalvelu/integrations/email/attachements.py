from __future__ import annotations

from typing import TYPE_CHECKING

from tilavarauspalvelu.typing import EmailAttachment
from utils.sentry import SentryLogger

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation

__all__ = [
    "get_reservation_ical_attachment",
]


def get_reservation_ical_attachment(reservation: Reservation) -> EmailAttachment | None:
    try:
        ical = reservation.actions.to_ical()
    except Exception as exc:  # noqa: BLE001
        SentryLogger.log_exception(exc, "Failed to generate iCal attachment for reservation email.")
        return None

    return EmailAttachment(
        filename="reservation_calendar.ics",
        content=ical.decode("utf-8"),
        mimetype="text/calendar",
    )
