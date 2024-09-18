from factory import fuzzy

from tilavarauspalvelu.models import Service

from ._base import GenericDjangoModelFactory

__all__ = [
    "ServiceFactory",
]


class ServiceFactory(GenericDjangoModelFactory[Service]):
    class Meta:
        model = Service

    name = fuzzy.FuzzyText()
