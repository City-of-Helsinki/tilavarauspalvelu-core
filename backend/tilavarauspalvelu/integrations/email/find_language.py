from __future__ import annotations

from typing import TYPE_CHECKING

from django.conf import settings

from tilavarauspalvelu.enums import Language

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Application, Reservation, ReservationSeries
    from tilavarauspalvelu.typing import Lang

__all__ = [
    "get_application_email_language",
    "get_reservation_email_language",
    "get_series_email_language",
]


def get_application_email_language(application: Application) -> Lang:
    """Get email notification language for the given application."""
    if application.user.preferred_language in Language.values:
        return application.user.preferred_language  # type: ignore[return-value]
    return settings.LANGUAGE_CODE  # type: ignore[return-value]


def get_series_email_language(series: ReservationSeries) -> Lang:
    """Get email notification language for the given series."""
    if series.user is None:
        return settings.LANGUAGE_CODE  # type: ignore[return-value]
    if getattr(series.user, "preferred_language", None) in Language.values:
        return series.user.preferred_language  # type: ignore[return-value]
    return settings.LANGUAGE_CODE  # type: ignore[return-value]


def get_reservation_email_language(reservation: Reservation) -> Lang:
    """Get email notification language for the given reservation."""
    if reservation.user is None:
        return settings.LANGUAGE_CODE  # type: ignore[return-value]
    if getattr(reservation.user, "preferred_language", None) in Language.values:
        return reservation.user.preferred_language  # type: ignore[return-value]
    return settings.LANGUAGE_CODE  # type: ignore[return-value]
