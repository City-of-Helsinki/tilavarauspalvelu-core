from __future__ import annotations

from typing import TYPE_CHECKING

from django.conf import settings

from tilavarauspalvelu.enums import Language

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Application, Reservation
    from tilavarauspalvelu.typing import Lang

__all__ = [
    "get_application_email_language",
]


def get_application_email_language(application: Application) -> Lang:
    """Get email notification language for the given application."""
    if getattr(application.user, "preferred_language", None) in Language.values:
        return application.user.preferred_language  # type: ignore[return-value]
    return settings.LANGUAGE_CODE


def get_reservation_email_language(reservation: Reservation) -> Lang:
    """Get email notification language for the given application."""
    if getattr(reservation.user, "preferred_language", None) in Language.values:
        return reservation.user.preferred_language  # type: ignore[return-value]
    if reservation.reservee_language in Language.values:
        return reservation.reservee_language  # type: ignore[return-value]
    return settings.LANGUAGE_CODE
