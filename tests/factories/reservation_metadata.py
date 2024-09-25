from collections.abc import Iterable

from factory import fuzzy

from tilavarauspalvelu.models import ReservationMetadataField, ReservationMetadataSet

from ._base import GenericDjangoModelFactory, ManyToManyFactory

__all__ = [
    "ReservationMetadataFieldFactory",
    "ReservationMetadataSetFactory",
]


POSSIBLE_FIELDS: set[str] = {
    "reservee_type",
    "reservee_first_name",
    "reservee_last_name",
    "reservee_organisation_name",
    "reservee_phone",
    "reservee_email",
    "reservee_id",
    "reservee_is_unregistered_association",
    "reservee_address_street",
    "reservee_address_city",
    "reservee_address_zip",
    "billing_first_name",
    "billing_last_name",
    "billing_phone",
    "billing_email",
    "billing_address_street",
    "billing_address_city",
    "billing_address_zip",
    "home_city",
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


class ReservationMetadataSetFactory(GenericDjangoModelFactory[ReservationMetadataSet]):
    class Meta:
        model = ReservationMetadataSet
        django_get_or_create = ["name"]

    name = fuzzy.FuzzyText()
    supported_fields = ManyToManyFactory(ReservationMetadataFieldFactory)
    required_fields = ManyToManyFactory(ReservationMetadataFieldFactory)

    @classmethod
    def create_basic(
        cls,
        name: str = "basic",
        *,
        supported_fields: Iterable[str] = (),
        required_fields: Iterable[str] = (),
    ) -> ReservationMetadataSet:
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
