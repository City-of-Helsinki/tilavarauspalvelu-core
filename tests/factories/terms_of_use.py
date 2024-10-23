import factory
from factory import LazyAttribute, fuzzy

from tilavarauspalvelu.enums import TermsOfUseTypeChoices
from tilavarauspalvelu.models import TermsOfUse

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "TermsOfUseFactory",
]


class TermsOfUseFactory(GenericDjangoModelFactory[TermsOfUse]):
    class Meta:
        model = TermsOfUse

    id = factory.Sequence(lambda n: f"terms-{n}")

    name = FakerFI("word")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    text = FakerFI("text")
    text_fi = LazyAttribute(lambda i: i.text)
    text_en = FakerEN("text")
    text_sv = FakerSV("text")

    terms_type = fuzzy.FuzzyChoice(TermsOfUseTypeChoices.values)

    application_rounds = ReverseForeignKeyFactory("tests.factories.ApplicationRoundFactory")

    cancellation_terms_reservation_units = ReverseForeignKeyFactory("tests.factories.ReservationUnitFactory")
    service_specific_terms_reservation_units = ReverseForeignKeyFactory("tests.factories.ReservationUnitFactory")
    pricing_terms_reservation_units = ReverseForeignKeyFactory("tests.factories.ReservationUnitFactory")
    payment_terms_reservation_units = ReverseForeignKeyFactory("tests.factories.ReservationUnitFactory")
