import factory
from factory import fuzzy

from permissions.models import GENERAL_PERMISSIONS, GeneralRole, GeneralRoleChoice, GeneralRolePermission

from ._base import GenericDjangoModelFactory

__all__ = [
    "GeneralRoleChoiceFactory",
    "GeneralRoleFactory",
    "GeneralRolePermissionFactory",
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
