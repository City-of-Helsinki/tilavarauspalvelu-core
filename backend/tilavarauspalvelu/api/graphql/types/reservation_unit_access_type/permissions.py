from __future__ import annotations

from typing import TYPE_CHECKING

from graphene_django_extensions.permissions import BasePermission

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import AnyUser


__all__ = [
    "ReservationUnitAccessTypePermission",
]


class ReservationUnitAccessTypePermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True
