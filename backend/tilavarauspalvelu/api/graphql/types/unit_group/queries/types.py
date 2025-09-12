from django.db import models
from undine import Field, GQLInfo, QueryType
from undine.exceptions import GraphQLPermissionError
from undine.relay import Node

from tilavarauspalvelu.api.graphql.extensions.utils import TranslatedField
from tilavarauspalvelu.models import UnitGroup, User
from tilavarauspalvelu.models.unit_group.queryset import UnitGroupQuerySet

from .filtersets import UnitGroupFilterSet
from .ordersets import UnitGroupOrderSet

__all__ = [
    "UnitGroupNode",
]


class UnitGroupNode(
    QueryType[UnitGroup],
    filterset=UnitGroupFilterSet,
    order_set=UnitGroupOrderSet,
    interfaces=[Node],
):
    pk = Field()

    name = Field(TranslatedField)
    name_fi = Field(deprecation_reason="Use 'name' instead.")
    name_en = Field(deprecation_reason="Use 'name' instead.")
    name_sv = Field(deprecation_reason="Use 'name' instead.")

    units = Field()

    @classmethod
    def __permissions__(cls, instance: UnitGroup, info: GQLInfo[User]) -> None:
        user = info.context.user
        if not user.permissions.has_any_role():
            msg = "No permission to access unit group"
            raise GraphQLPermissionError(msg)

    @classmethod
    def __filter_queryset__(cls, queryset: UnitGroupQuerySet, info: GQLInfo[User]) -> models.QuerySet:
        # Always hide UnitGroups that don't have any units.
        # They are not useful for the frontend, as UnitGroups are set to units outside of the GraphQL API.
        return queryset.exclude(units__isnull=True).distinct()
