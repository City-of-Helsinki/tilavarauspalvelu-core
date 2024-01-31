import graphene
from django.db.models import QuerySet
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType, get_all_translatable_fields
from common.typing import GQLInfo
from reservation_units.models import Keyword, KeywordCategory, KeywordGroup


class KeywordType(AuthNode, OldPrimaryKeyObjectType):
    class Meta:
        model = Keyword
        fields = ["pk"] + get_all_translatable_fields(model)
        filter_fields = ["name_fi", "name_sv", "name_en"]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection


class KeywordGroupType(AuthNode, OldPrimaryKeyObjectType):
    keywords = graphene.List(KeywordType)

    class Meta:
        model = KeywordGroup
        fields = ["pk"] + get_all_translatable_fields(model)
        filter_fields = ["name_fi", "name_sv", "name_en"]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    def resolve_keywords(root: KeywordGroup, info: GQLInfo) -> QuerySet[Keyword]:
        return root.keywords.all()


class KeywordCategoryType(AuthNode, OldPrimaryKeyObjectType):
    keyword_groups = graphene.List(KeywordGroupType)

    class Meta:
        model = KeywordCategory
        fields = ["pk"] + get_all_translatable_fields(model)
        filter_fields = ["name_fi", "name_sv", "name_en"]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    def resolve_keyword_groups(root: KeywordCategory, info: GQLInfo) -> QuerySet[KeywordGroup]:
        return root.keyword_groups.all()
