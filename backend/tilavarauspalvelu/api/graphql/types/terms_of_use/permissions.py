from __future__ import annotations

from typing import Any

from graphene_django_extensions.permissions import BasePermission

from tilavarauspalvelu.models import TermsOfUse
from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "TermsOfUsePermission",
]


class TermsOfUsePermission(BasePermission[TermsOfUse, AnyUser]):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return False
