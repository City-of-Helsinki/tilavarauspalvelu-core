from __future__ import annotations

from tilavarauspalvelu.enums import UserRoleChoice
from tilavarauspalvelu.models import GeneralRole

from ._base import ForeignKeyFactory, GenericDjangoModelFactory

__all__ = [
    "GeneralRoleFactory",
]


class GeneralRoleFactory(GenericDjangoModelFactory[GeneralRole]):
    class Meta:
        model = GeneralRole
        django_get_or_create = ["role", "user"]

    user = ForeignKeyFactory("tests.factories.UserFactory")
    role = UserRoleChoice.ADMIN.value
    assigner = None
