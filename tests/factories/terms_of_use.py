import factory
from factory import fuzzy

from terms_of_use.models import TermsOfUse

from ._base import GenericDjangoModelFactory

__all__ = [
    "TermsOfUseFactory",
]


class TermsOfUseFactory(GenericDjangoModelFactory[TermsOfUse]):
    class Meta:
        model = TermsOfUse

    id = factory.Sequence(lambda n: f"terms-{n}")
    name = fuzzy.FuzzyText()
    text = fuzzy.FuzzyText()
    terms_type = fuzzy.FuzzyChoice([terms_type for terms_type, _ in TermsOfUse.TERMS_TYPES])
