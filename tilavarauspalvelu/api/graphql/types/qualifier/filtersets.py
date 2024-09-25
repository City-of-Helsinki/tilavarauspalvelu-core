from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from tilavarauspalvelu.models import Qualifier

__all__ = [
    "QualifierFilterSet",
]


class QualifierFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = Qualifier
        fields = [
            "name_fi",
            "name_en",
            "name_sv",
        ]
