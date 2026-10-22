from __future__ import annotations

from graphene_django_extensions.permissions import BasePermission

from tilavarauspalvelu.models import RejectedOccurrence
from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "RejectedOccurrencePermission",
]


class RejectedOccurrencePermission(BasePermission[RejectedOccurrence, AnyUser]):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return user.is_authenticated
