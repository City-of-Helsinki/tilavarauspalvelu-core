import graphene
from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import TermsOfUse

from .filtersets import TermsOfUseFilterSet
from .permissions import TermsOfUsePermission

__all__ = [
    "TermsOfUseNode",
]


class TermsOfUseNode(DjangoNode):
    pk = graphene.String()

    class Meta:
        model = TermsOfUse
        fields = [
            "pk",
            "name",
            "text",
            "terms_type",
        ]
        filterset_class = TermsOfUseFilterSet
        permission_classes = [TermsOfUsePermission]
