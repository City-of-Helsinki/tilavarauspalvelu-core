from __future__ import annotations

from typing import TYPE_CHECKING, TypedDict

if TYPE_CHECKING:
    from tilavarauspalvelu.enums import ReservationCancelReasonChoice

__all__ = [
    "ReservationCancelReasonType",
]


class ReservationCancelReasonType(TypedDict):
    value: ReservationCancelReasonChoice
    reason_fi: str
    reason_en: str
    reason_sv: str
