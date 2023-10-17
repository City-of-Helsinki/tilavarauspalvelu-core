from collections.abc import Iterable
from typing import Any

import factory
from factory import fuzzy

from permissions.models import (
    GENERAL_PERMISSIONS,
    SERVICE_SECTOR_PERMISSIONS,
    UNIT_PERMISSIONS,
    GeneralRole,
    GeneralRoleChoice,
    GeneralRolePermission,
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRole,
    UnitRoleChoice,
    UnitRolePermission,
)
from spaces.models import Unit

from ._base import GenericDjangoModelFactory

__all__ = [
    "GeneralRoleChoiceFactory",
    "GeneralRoleFactory",
    "GeneralRolePermissionFactory",
    "ServiceSectorRoleChoiceFactory",
    "ServiceSectorRoleFactory",
    "ServiceSectorRolePermissionFactory",
    "UnitRoleChoiceFactory",
    "UnitRoleFactory",
    "UnitRolePermissionFactory",
]


class GeneralRoleChoiceFactory(GenericDjangoModelFactory[GeneralRoleChoice]):
    class Meta:
        model = GeneralRoleChoice
        django_get_or_create = ["code"]

    code = factory.Faker("text", max_nb_chars=50)
    verbose_name = factory.Faker("text", max_nb_chars=255)


class GeneralRoleFactory(GenericDjangoModelFactory[GeneralRole]):
    class Meta:
        model = GeneralRole
        django_get_or_create = ["role", "user"]

    role = factory.SubFactory("tests.factories.GeneralRoleChoiceFactory")
    user = factory.SubFactory("tests.factories.UserFactory")


class GeneralRolePermissionFactory(GenericDjangoModelFactory[GeneralRolePermission]):
    class Meta:
        model = GeneralRolePermission
        django_get_or_create = ["role", "permission"]

    role = factory.SubFactory("tests.factories.GeneralRoleChoiceFactory")
    permission = fuzzy.FuzzyChoice([perm[0] for perm in GENERAL_PERMISSIONS])


class ServiceSectorRoleChoiceFactory(GenericDjangoModelFactory[ServiceSectorRoleChoice]):
    class Meta:
        model = ServiceSectorRoleChoice
        django_get_or_create = ["code"]

    code = factory.Faker("text", max_nb_chars=50)
    verbose_name = factory.Faker("text", max_nb_chars=255)


class ServiceSectorRoleFactory(GenericDjangoModelFactory[ServiceSectorRole]):
    class Meta:
        model = ServiceSectorRole
        django_get_or_create = ["role", "service_sector", "user"]

    role = factory.SubFactory("tests.factories.ServiceSectorRoleChoiceFactory")
    service_sector = factory.SubFactory("tests.factories.ServiceSectorFactory")
    user = factory.SubFactory("tests.factories.UserFactory")


class ServiceSectorRolePermissionFactory(GenericDjangoModelFactory[ServiceSectorRolePermission]):
    class Meta:
        model = ServiceSectorRolePermission
        django_get_or_create = ["role", "permission"]

    role = factory.SubFactory("tests.factories.ServiceSectorRoleChoiceFactory")
    permission = fuzzy.FuzzyChoice([perm[0] for perm in SERVICE_SECTOR_PERMISSIONS])


class UnitRoleChoiceFactory(GenericDjangoModelFactory[UnitRoleChoice]):
    class Meta:
        model = UnitRoleChoice
        django_get_or_create = ["code"]

    code = factory.Faker("text", max_nb_chars=50)
    verbose_name = factory.Faker("text", max_nb_chars=255)


class UnitRoleFactory(GenericDjangoModelFactory[UnitRole]):
    class Meta:
        model = UnitRole
        django_get_or_create = ["role", "user"]

    role = factory.SubFactory("tests.factories.UnitRoleChoiceFactory")
    user = factory.SubFactory("tests.factories.UserFactory")

    @factory.post_generation
    def unit(self, create: bool, units: Iterable[Unit] | None, **kwargs: Any) -> None:
        if not create:
            return

        if not units and kwargs:
            from .unit import UnitFactory

            self.unit.add(UnitFactory.create(**kwargs))

        for unit in units or []:
            self.unit.add(unit)

    @factory.post_generation
    def unit_group(self, create: bool, unit_groups: Iterable[Unit] | None, **kwargs: Any) -> None:
        if not create:
            return

        if not unit_groups and kwargs:
            from .unit import UnitGroupFactory

            self.unit_group.add(UnitGroupFactory.create(**kwargs))

        for unit_group in unit_groups or []:
            self.unit_group.add(unit_group)


class UnitRolePermissionFactory(GenericDjangoModelFactory[UnitRolePermission]):
    class Meta:
        model = UnitRolePermission
        django_get_or_create = ["role", "permission"]

    role = factory.SubFactory("tests.factories.UnitRoleChoiceFactory")
    permission = fuzzy.FuzzyChoice([perm[0] for perm in UNIT_PERMISSIONS])
