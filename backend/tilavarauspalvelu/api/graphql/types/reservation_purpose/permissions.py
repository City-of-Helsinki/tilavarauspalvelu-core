from __future__ import annotations

from typing import Any

from graphene_django_extensions.permissions import BasePermission

from tilavarauspalvelu.models import ReservationPurpose
from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "ReservationPurposePermission",
]


class ReservationPurposePermission(BasePermission[ReservationPurpose, AnyUser]):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_reservation_related_data()
