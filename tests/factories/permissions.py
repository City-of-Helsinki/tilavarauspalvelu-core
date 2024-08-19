import factory

from permissions.enums import UserRoleChoice
from permissions.models import GeneralRole, UnitRole

from ._base import GenericDjangoModelFactory, ManyToManyFactory

__all__ = [
    "GeneralRoleFactory",
    "UnitRoleFactory",
]


class GeneralRoleFactory(GenericDjangoModelFactory[GeneralRole]):
    class Meta:
        model = GeneralRole
        django_get_or_create = ["role", "user"]

    role = UserRoleChoice.ADMIN.value
    user = factory.SubFactory("tests.factories.UserFactory")


class UnitRoleFactory(GenericDjangoModelFactory[UnitRole]):
    class Meta:
        model = UnitRole
        django_get_or_create = ["role", "user"]

    role = UserRoleChoice.ADMIN.value
    user = factory.SubFactory("tests.factories.UserFactory")

    units = ManyToManyFactory("tests.factories.UnitFactory")
    unit_groups = ManyToManyFactory("tests.factories.UnitGroupFactory")
