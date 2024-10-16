from __future__ import annotations

from typing import TYPE_CHECKING

from django.conf import settings

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Application, Reservation
    from tilavarauspalvelu.typing import Lang

__all__ = [
    "get_application_email_language",
]


def get_application_email_language(application: Application) -> Lang:
    """Get email notification language for the given application."""
    if application.user is None:
        return settings.LANGUAGE_CODE
    return application.user.get_preferred_language()


def get_reservation_email_language(reservation: Reservation) -> Lang:
    """Get email notification language for the given application."""
    if reservation.user is None:
        return settings.LANGUAGE_CODE
    return reservation.user.get_preferred_language()
