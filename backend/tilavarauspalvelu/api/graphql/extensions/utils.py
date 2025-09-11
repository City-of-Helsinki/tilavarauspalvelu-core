import dataclasses
from collections.abc import Callable, Iterable
from typing import Any

from django.db import models
from graphql import (
    FieldNode,
    FragmentDefinitionNode,
    FragmentSpreadNode,
    GraphQLField,
    GraphQLFieldResolver,
    GraphQLObjectType,
    GraphQLString,
    InlineFragmentNode,
    SelectionNode,
)
from modeltranslation.manager import get_translatable_fields_for_model
from modeltranslation.settings import AVAILABLE_LANGUAGES
from modeltranslation.utils import build_lang, build_localized_fieldname
from undine import Field, GQLInfo
from undine.optimizer import OptimizationData
from undine.utils.graphql.type_registry import get_or_create_graphql_object_type
from undine.utils.text import to_schema_name

from tilavarauspalvelu.models import User

__all__ = [
    "NullablePermissions",
    "get_field_names",
]


def get_field_names(selections: Iterable[SelectionNode], fragments: dict[str, FragmentDefinitionNode]) -> list[str]:
    """Get field names selected in the current query. Top level object type only."""
    results: list[str] = []

    for selection in selections:
        match selection:
            case FieldNode():
                field_node = selection
                results.append(field_node.name.value)

            case InlineFragmentNode():
                inline_node = selection
                results += get_field_names(inline_node.selection_set.selections, fragments)

            case FragmentSpreadNode():
                spread_node = selection
                fragment = fragments[spread_node.name.value]
                results += get_field_names(fragment.selection_set.selections, fragments)

    return results


@dataclasses.dataclass(frozen=True, slots=True, kw_only=True)
class NullablePermissions:
    """
    Adds permission checks to a Field such that the field returns a null value
    if the permission check fails instead of raising an exception.

    >>> public = NullablePermissions(permission_check=...)
    >>>
    >>> class TaskType(QueryType[Task]):
    >>>     name = Field() | public
    """

    permission_check: Callable[[Any, GQLInfo], bool]

    def __ror__(self, field: object) -> Field:
        if not isinstance(field, Field):
            return NotImplemented

        # Replaced with 'NullablePermissionResolver' using converters
        field.resolver_func = self
        # Don't run any permission checks for subtypes, e.g. related QueryTypes
        field.permissions_func = lambda *args, **kwargs: None
        # Field can now return null, even if otherwise it wouldn't
        field.nullable = True
        return field


@dataclasses.dataclass(frozen=True, slots=True, kw_only=True)
class NullablePermissionResolver:
    """Resolver that adds permission check that returns null if failed."""

    field: Field
    permission_check: Callable[[Any, GQLInfo], bool]
    resolver: GraphQLFieldResolver

    def __call__(self, root: Any, info: GQLInfo[User], **kwargs: Any) -> Any:
        if not self.permission_check(root, info):
            return None
        return self.resolver(root, info, **kwargs)


@dataclasses.dataclass(frozen=True, slots=True, kw_only=True)
class TranslatedField:
    """
    Use on the translated field of a model to resolve to its translations.

    >>> class TaskType(QueryType[Task]):
    >>>     name = Field(TranslatedField)

    Creates a field like this:

    ```graphql
    type TranslatedField {
        fi: String
        en: String
        sv: String
    }

    type TaskType {
        name: TranslatedField
    }
    ```
    """

    field: models.CharField

    def __post_init__(self) -> None:
        translatable_fields = get_translatable_fields_for_model(model=self.field.model)
        if self.field.name not in translatable_fields:
            msg = f"Field {self.field.name} is not translatable."
            raise ValueError(msg)

    def resolve(self, root: Any, info: GQLInfo, **kwargs: Any) -> dict[str, str]:
        return {lang: getattr(root, build_localized_fieldname(self.field.name, lang)) for lang in AVAILABLE_LANGUAGES}

    def graphql_type(self) -> GraphQLObjectType:
        return get_or_create_graphql_object_type(
            name="TranslatedField",
            fields={to_schema_name(build_lang(lang)): GraphQLField(GraphQLString) for lang in AVAILABLE_LANGUAGES},
            description="Resolves a translatable field to its translations.",
        )

    def optimize(self, data: OptimizationData, info: GQLInfo) -> None:
        for lang in AVAILABLE_LANGUAGES:
            field_name = build_localized_fieldname(self.field.name, lang)
            data.only_fields.add(field_name)
