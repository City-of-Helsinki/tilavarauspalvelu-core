from __future__ import annotations

from typing import Any

from graphene_django_extensions.permissions import BasePermission
from graphene_django_extensions.typing import AnyUser


class ReservationUnitTypePermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return False
