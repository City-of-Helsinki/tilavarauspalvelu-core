from __future__ import annotations

from factory import fuzzy

from tilavarauspalvelu.models import ReservationMetadataField

from ._base import GenericDjangoModelFactory, ManyToManyFactory

__all__ = [
    "ReservationMetadataFieldFactory",
]


POSSIBLE_FIELDS: set[str] = {
    "reservee_type",
    "reservee_first_name",
    "reservee_last_name",
    "reservee_organisation_name",
    "reservee_phone",
    "reservee_email",
    "reservee_identifier",
    "reservee_address_street",
    "reservee_address_city",
    "reservee_address_zip",
    "age_group",
    "applying_for_free_of_charge",
    "free_of_charge_reason",
    "name",
    "description",
    "num_persons",
    "purpose",
}


class ReservationMetadataFieldFactory(GenericDjangoModelFactory[ReservationMetadataField]):
    class Meta:
        model = ReservationMetadataField
        django_get_or_create = ["field_name"]

    field_name = fuzzy.FuzzyChoice(POSSIBLE_FIELDS)

    metadata_sets_supported = ManyToManyFactory("tests.factories.ReservationMetadataSetFactory")
    metadata_sets_required = ManyToManyFactory("tests.factories.ReservationMetadataSetFactory")
