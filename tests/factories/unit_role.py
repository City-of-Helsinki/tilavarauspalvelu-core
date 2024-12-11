from __future__ import annotations

from tilavarauspalvelu.enums import UserRoleChoice
from tilavarauspalvelu.models import UnitRole

from ._base import ForeignKeyFactory, GenericDjangoModelFactory, ManyToManyFactory

__all__ = [
    "UnitRoleFactory",
]


class UnitRoleFactory(GenericDjangoModelFactory[UnitRole]):
    class Meta:
        model = UnitRole
        django_get_or_create = ["role", "user"]

    user = ForeignKeyFactory("tests.factories.UserFactory")
    role = UserRoleChoice.ADMIN.value
    assigner = ForeignKeyFactory("tests.factories.UserFactory")

    units = ManyToManyFactory("tests.factories.UnitFactory")
    unit_groups = ManyToManyFactory("tests.factories.UnitGroupFactory")

    role_active = True
    from_ad_group = False
