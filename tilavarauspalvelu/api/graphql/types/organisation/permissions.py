from typing import Any

from graphene_django_extensions.permissions import BasePermission

from tilavarauspalvelu.typing import AnyUser


class OrganisationPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return user.is_authenticated

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return False
