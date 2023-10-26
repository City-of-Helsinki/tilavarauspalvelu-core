from collections.abc import Callable
from functools import partial
from itertools import chain
from typing import Any, TypedDict

import graphene
from django.db import models
from django.db.models import Model
from graphene import Connection, Field, relay
from graphene.types.resolver import attr_resolver
from graphene.types.unmountedtype import UnmountedType
from graphene_django import DjangoConnectionField, DjangoListField, DjangoObjectType
from graphene_django.converter import convert_django_field
from graphene_django.filter import DjangoFilterConnectionField
from graphene_django.types import DjangoObjectTypeOptions, ErrorType
from graphene_permissions.permissions import BasePermission

from api.graphql.extensions.permission_helpers import Check, private_field
from common.typing import AnyUser, GQLInfo
from common.utils import get_translation_fields

__all__ = [
    "DjangoAuthNode",
    "TypedDictField",
]


class TVPBaseConnection(Connection):
    """Connection field that adds the `length` field to the connection."""

    class Meta:
        abstract = True

    total_count = graphene.Int()

    def resolve_total_count(self, info: GQLInfo, **kwargs: Any) -> int:
        return self.length  # type: ignore


class DjangoAuthNode(DjangoObjectType):
    """
    Custom base class for all GraphQL-types that are backed by a Django model.

    Adds the following features to all types that inherit it:
    - Makes the `TVPBaseConnection` the default connection for the type.
    - Makes the `Node` interface the default interface for the type.
    - Adds the `pk` field and resolver to the type if present on Meta.fields.
    - Adds all translated fields to the model if any translatable fields are present in `Meta.fields`.
    - Adds the `errors` list-field to the type for returning errors.
    - Adds convenience methods for creating fields/list-fields/nodes/connections for the type.
    - Adds permission checks from permission classes defined in `Meta.permission_classes` to the
      `get_queryset` and `get_node` methods.
    - Adds the `filter_queryset` method that can be overridden to add additional filtering for both
      `get_queryset` and `get_node` querysets.
    - Adds option to define a `Meta.restricted_fields` dict, which adds permission checks to the resolvers of
      the fields defined in the dict. This can be used to hide fields from users that do not have
      permission to view them.
    """

    class Meta:
        abstract = True

    errors = graphene.List(ErrorType, description="May contain more than one error for same field.")

    @classmethod
    def Field(cls, **kwargs: Any) -> Field:
        return Field(cls, **kwargs)

    @classmethod
    def ListField(cls, **kwargs: Any) -> DjangoListField:
        return DjangoListField(cls, **kwargs)

    @classmethod
    def Node(cls, **kwargs: Any) -> relay.Node.Field:
        return relay.Node.Field(cls, **kwargs)

    @classmethod
    def Connection(cls, **kwargs: Any) -> DjangoFilterConnectionField | DjangoConnectionField:
        if cls._meta.filterset_class is None and cls._meta.filter_fields is None:
            return DjangoConnectionField(cls, **kwargs)
        return DjangoFilterConnectionField(cls, **kwargs)

    @classmethod
    def filter_queryset(cls, queryset: models.QuerySet, user: AnyUser) -> models.QuerySet:
        """Implement this method to add additional filtering to the queryset."""
        return queryset

    @classmethod
    def __init_subclass_with_meta__(
        cls,
        permission_classes: tuple[BasePermission] | None = None,
        restricted_fields: dict[str, Check] | None = None,
        **options: Any,
    ) -> None:
        _meta = DjangoObjectTypeOptions(cls)
        _meta.permission_classes = permission_classes or ()

        fields: list[str] | None = options.get("fields")
        model: type[Model] | None = options.get("model")

        # Add translatable fields for all included fields
        if model is not None and fields not in [None, "__all__"]:
            translation_fields = get_translation_fields(model, fields)
            options["fields"] = fields = sorted(chain(fields, translation_fields))

        if not hasattr(cls, "pk") and (fields == "__all__" or "pk" in fields):
            cls._add_pk_field(model)

        cls._add_field_permission_checks(fields, restricted_fields)

        options.setdefault("connection_class", TVPBaseConnection)
        options.setdefault("interfaces", (graphene.relay.Node,))

        super().__init_subclass_with_meta__(_meta=_meta, **options)

    @classmethod
    def _add_pk_field(cls, model: models.Model | None) -> None:
        if model is not None and model._meta.pk.name == "id":
            cls.pk = graphene.Int()
        else:
            cls.pk = graphene.ID()
        cls.resolve_pk = cls.resolve_id

    @classmethod
    def _add_field_permission_checks(cls, fields: list[str], restricted_fields: dict[str, Check]) -> None:
        for field_name, check in (restricted_fields or {}).items():
            if field_name not in fields:
                continue

            resolver: Callable | None = getattr(cls, f"resolve_{field_name}", None)
            if resolver is None:
                resolver = partial(attr_resolver, field_name, None)  # must be positional args!

            setattr(cls, f"resolve_{field_name}", private_field(check)(resolver))

    @classmethod
    def get_queryset(cls, queryset: models.QuerySet, info: GQLInfo) -> models.QuerySet:
        """Override `filter_queryset` instead of this method to add filtering of possible rows."""
        if not cls.has_filter_permissions(info):
            raise PermissionError("You do not have permission to access this node.")
        return cls.filter_queryset(queryset, info.context.user)

    @classmethod
    def get_node(cls, info: GQLInfo, id: Any) -> Model | None:
        """Override `filter_queryset` instead of this method to add filtering of possible rows."""
        if not cls.has_node_permissions(info, id):
            raise PermissionError("You do not have permission to access this node.")
        queryset = cls._meta.model.objects.filter(pk=id)
        return cls.filter_queryset(queryset, info.context.user).first()

    @classmethod
    def has_filter_permissions(cls, info: GQLInfo) -> bool:
        return all(perm.has_filter_permission(info) for perm in cls._meta.permission_classes)

    @classmethod
    def has_node_permissions(cls, info: GQLInfo, id: Any) -> bool:
        return all(perm.has_node_permission(info, id) for perm in cls._meta.permission_classes)


class TypedDictField(graphene.Field):
    """Field that converts a TypedDict to a graphene ObjectType."""

    def __init__(self, typed_dict: type[TypedDict], *arg: Any, **kwargs: Any) -> None:
        type_ = convert_typed_dict_to_graphene_type(typed_dict)
        super().__init__(type_, *arg, **kwargs)


_CONVERSION_TABLE: dict[type, type[models.Field]] = {
    int: models.IntegerField,
    str: models.CharField,
    bool: models.BooleanField,
    float: models.FloatField,
    dict: models.JSONField,
    list: models.JSONField,
    set: models.JSONField,
    tuple: models.JSONField,
    bytes: models.BinaryField,
}


def convert_typed_dict_to_graphene_type(typed_dict: type[TypedDict]) -> type[graphene.ObjectType]:
    graphene_types: dict[str, UnmountedType] = {}
    for field_name, type_ in typed_dict.__annotations__.items():
        model_field = _CONVERSION_TABLE.get(type_)
        if model_field is None:
            raise ValueError(f"Cannot convert field {field_name} of type {type_} to model field.")
        graphene_type = convert_django_field(model_field, field_name, None)
        graphene_types[field_name] = graphene_type

    return type(f"{typed_dict.__name__}Type", (graphene.ObjectType,), graphene_types)  # type: ignore
