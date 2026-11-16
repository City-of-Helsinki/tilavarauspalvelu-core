from __future__ import annotations

from factory import LazyAttribute

from tilavarauspalvelu.models import ParticipantGender

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "ParticipantGenderFactory",
]


class ParticipantGenderFactory(GenericDjangoModelFactory[ParticipantGender]):
    class Meta:
        model = ParticipantGender

    name = FakerFI("word")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    application_sections = ReverseForeignKeyFactory("tests.factories.ApplicationSectionFactory")
