from __future__ import annotations

from typing import TYPE_CHECKING

from tilavarauspalvelu.models import ReservationMetadataSet

from ._base import FakerFI, GenericDjangoModelFactory, ManyToManyFactory, ReverseForeignKeyFactory

if TYPE_CHECKING:
    from collections.abc import Iterable

__all__ = [
    "ReservationMetadataSetFactory",
]


class ReservationMetadataSetFactory(GenericDjangoModelFactory[ReservationMetadataSet]):
    class Meta:
        model = ReservationMetadataSet
        django_get_or_create = ["name"]

    name = FakerFI("word", unique=True)

    reservation_units = ReverseForeignKeyFactory("tests.factories.ReservationUnitFactory")

    supported_fields = ManyToManyFactory("tests.factories.ReservationMetadataFieldFactory")
    required_fields = ManyToManyFactory("tests.factories.ReservationMetadataFieldFactory")

    @classmethod
    def create_basic(
        cls,
        name: str = "basic",
        *,
        supported_fields: Iterable[str] = (),
        required_fields: Iterable[str] = (),
    ) -> ReservationMetadataSet:
        from .reservation_metadata_field import POSSIBLE_FIELDS, ReservationMetadataFieldFactory

        metadata_set = cls.create(name=name)

        if extra_fields := set(supported_fields) - POSSIBLE_FIELDS:
            msg = f"Unknowns fields in `supported_fields`: {extra_fields}"
            raise ValueError(msg)

        if extra_fields := set(required_fields) - POSSIBLE_FIELDS:
            msg = f"Unknowns fields in `required_fields`: {extra_fields}"
            raise ValueError(msg)

        if extra_fields := set(required_fields) - set(supported_fields):
            msg = f"Received `required_fields` that are not in `supported_fields`: {extra_fields}"
            raise ValueError(msg)

        defaults: list[str] = [
            "reservee_first_name",
            "reservee_last_name",
            "reservee_email",
            "reservee_phone",
        ]

        supported_fields = supported_fields or defaults
        for field_name in supported_fields:
            field = ReservationMetadataFieldFactory.create(field_name=field_name)
            metadata_set.supported_fields.add(field)

        required_fields = required_fields or supported_fields
        for field_name in required_fields:
            field = ReservationMetadataFieldFactory.create(field_name=field_name)
            metadata_set.required_fields.add(field)

        return metadata_set
