from __future__ import annotations

from typing import TypedDict

import graphene

from tilavarauspalvelu.enums import ReservationCancelReasonChoice

__all__ = [
    "ReservationCancelReasonType",
]


class ReservationCancelReasonType(graphene.ObjectType):
    value = graphene.Field(graphene.Enum.from_enum(ReservationCancelReasonChoice), required=True)
    reason_fi = graphene.String(required=True)
    reason_en = graphene.String(required=True)
    reason_sv = graphene.String(required=True)


class CancelReasonDict(TypedDict):
    value: ReservationCancelReasonChoice
    reason_fi: str
    reason_en: str
    reason_sv: str
