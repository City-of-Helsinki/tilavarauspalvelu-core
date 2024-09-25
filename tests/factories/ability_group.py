from factory import fuzzy

from tilavarauspalvelu.models import AbilityGroup

from ._base import GenericDjangoModelFactory

__all__ = [
    "AbilityGroupFactory",
]


class AbilityGroupFactory(GenericDjangoModelFactory[AbilityGroup]):
    class Meta:
        model = AbilityGroup

    name = fuzzy.FuzzyText()
