from collections.abc import Iterable
from typing import Any

import factory
from factory import fuzzy

from reservations.models import ReservationMetadataField, ReservationMetadataSet

from ._base import GenericDjangoModelFactory

__all__ = [
    "ReservationMetadataFieldFactory",
    "ReservationMetadataSetFactory",
]


class ReservationMetadataFieldFactory(GenericDjangoModelFactory[ReservationMetadataField]):
    class Meta:
        model = ReservationMetadataField
        django_get_or_create = ["field_name"]

    field_name = fuzzy.FuzzyText()


class ReservationMetadataSetFactory(GenericDjangoModelFactory[ReservationMetadataSet]):
    class Meta:
        model = ReservationMetadataSet
        django_get_or_create = ["name"]

    name = fuzzy.FuzzyText()

    @factory.post_generation
    def supported_fields(self, create: bool, fields: Iterable[ReservationMetadataField] | None, **kwargs: Any):
        if not create:
            return

        if not fields and kwargs:
            self.supported_fields.add(ReservationMetadataFieldFactory.create(**kwargs))

        for field in fields or []:
            self.supported_fields.add(field)

    @factory.post_generation
    def required_fields(self, create: bool, fields: Iterable[ReservationMetadataField] | None, **kwargs: Any):
        if not create:
            return

        if not fields and kwargs:
            self.required_fields.add(ReservationMetadataFieldFactory.create(**kwargs))

        for field in fields or []:
            self.required_fields.add(field)
