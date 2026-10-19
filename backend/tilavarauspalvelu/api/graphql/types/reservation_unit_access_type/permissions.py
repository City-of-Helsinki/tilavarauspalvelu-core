from __future__ import annotations

from graphene_django_extensions.permissions import BasePermission

from tilavarauspalvelu.models import ReservationUnitAccessType
from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "ReservationUnitAccessTypePermission",
]


class ReservationUnitAccessTypePermission(BasePermission[ReservationUnitAccessType, AnyUser]):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True
