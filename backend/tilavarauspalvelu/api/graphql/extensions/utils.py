import dataclasses
from collections.abc import Callable, Iterable
from typing import Any

from graphql import (
    FieldNode,
    FragmentDefinitionNode,
    FragmentSpreadNode,
    GraphQLFieldResolver,
    InlineFragmentNode,
    SelectionNode,
)
from undine import Field, GQLInfo

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
