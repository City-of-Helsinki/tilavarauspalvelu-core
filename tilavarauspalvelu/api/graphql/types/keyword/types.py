from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import Keyword, KeywordCategory, KeywordGroup

from .filtersets import KeywordCategoryFilterSet, KeywordFilterSet, KeywordGroupFilterSet
from .permissions import KeywordCategoryPermission, KeywordGroupPermission, KeywordPermission

__all__ = [
    "KeywordCategoryNode",
    "KeywordGroupNode",
    "KeywordNode",
]


class KeywordNode(DjangoNode):
    class Meta:
        model = Keyword
        fields = [
            "pk",
            "name",
        ]
        filterset_class = KeywordFilterSet
        permission_classes = [KeywordPermission]


class KeywordGroupNode(DjangoNode):
    class Meta:
        model = KeywordGroup
        fields = [
            "pk",
            "name",
            "keywords",
        ]
        filterset_class = KeywordGroupFilterSet
        permission_classes = [KeywordGroupPermission]


class KeywordCategoryNode(DjangoNode):
    class Meta:
        model = KeywordCategory
        fields = [
            "pk",
            "name",
            "keyword_groups",
        ]
        filterset_class = KeywordCategoryFilterSet
        permission_classes = [KeywordCategoryPermission]
