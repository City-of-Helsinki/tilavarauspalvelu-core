import dataclasses
from enum import StrEnum
from typing import Any

from django.db.models import Q
from django.db.models.constants import LOOKUP_SEP
from graphql import GraphQLBoolean, GraphQLEnumValue, GraphQLFieldResolver, GraphQLInputType, GraphQLOutputType
from lookup_property import L
from lookup_property.field import LookupPropertyField
from lookup_property.typing import LOOKUP_PREFIX
from undine import DjangoExpression, Field, Filter, GQLInfo
from undine.converters import (
    convert_to_description,
    convert_to_field_ref,
    convert_to_field_resolver,
    convert_to_filter_ref,
    convert_to_filter_resolver,
    convert_to_graphql_argument_map,
    convert_to_graphql_type,
    convert_to_order_ref,
    convert_to_python_type,
    is_field_nullable,
    is_many,
)
from undine.optimizer import OptimizationData
from undine.resolvers import ModelAttributeResolver
from undine.typing import GraphQLFilterResolver
from undine.utils.graphql.type_registry import get_or_create_graphql_enum
from undine.utils.model_utils import determine_output_field, get_model_field

from tilavarauspalvelu.models import User

from .utils import NullablePermissionResolver, NullablePermissions


def get_lookup_name(ref: L) -> str:
    lookup = ""
    parts = ref.lookup.split(LOOKUP_SEP)
    last = len(parts) - 1
    for i, part in enumerate(parts):
        if i == last:
            lookup += f"{LOOKUP_PREFIX}{part}"
            break
        lookup += f"{part}{LOOKUP_SEP}"
    return lookup


@convert_to_graphql_type.register
def _(ref: L, **kwargs: Any) -> GraphQLInputType | GraphQLOutputType:
    model = kwargs["model"]

    lookup_field: LookupPropertyField = get_model_field(model=model, lookup=get_lookup_name(ref))  # type: ignore[assignment]
    expr = lookup_field.target_property.expression

    if isinstance(expr, Q):
        return GraphQLBoolean

    determine_output_field(expr, model=model)
    output_field = expr.output_field
    return convert_to_graphql_type(output_field, **kwargs)


@convert_to_python_type.register
def _(ref: L, **kwargs: Any) -> Any:
    # Has this if called from 'convert_to_graphql_type' for 'LookupRef'
    model = kwargs["model"]

    lookup_field: LookupPropertyField = get_model_field(model=model, lookup=get_lookup_name(ref))  # type: ignore[assignment]
    expr = lookup_field.target_property.expression

    if isinstance(expr, Q):
        return bool

    determine_output_field(expr, model=model)
    output_field = expr.output_field
    return convert_to_python_type(output_field, **kwargs)


@convert_to_description.register
def _(_: L, **kwargs: Any) -> str | None:
    return None


@is_field_nullable.register
def _(ref: L, **kwargs: Any) -> bool:
    caller: Field = kwargs["caller"]
    model = caller.query_type.__model__

    lookup_field: LookupPropertyField = get_model_field(model=model, lookup=get_lookup_name(ref))  # type: ignore[assignment]
    expr = lookup_field.target_property.expression

    if isinstance(expr, Q):
        return False

    determine_output_field(expr, model=model)
    output_field = expr.output_field
    return is_field_nullable(output_field, **kwargs)


@is_many.register
def _(ref: L, **kwargs: Any) -> bool:
    model = kwargs["model"]

    lookup_field: LookupPropertyField = get_model_field(model=model, lookup=get_lookup_name(ref))  # type: ignore[assignment]
    expr = lookup_field.target_property.expression

    if isinstance(expr, Q):
        return False

    determine_output_field(expr, model=model)
    output_field = expr.output_field
    return is_many(output_field, **kwargs)


@convert_to_field_ref.register
def _(ref: L, **kwargs: Any) -> Any:
    caller: Field = kwargs["caller"]

    def optimizer_func(field: Field, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.annotations[field.name] = ref

    caller.optimizer_func = optimizer_func
    return ref


@convert_to_graphql_argument_map.register
def _(_: L, **kwargs: Any) -> Any:
    return {}


@convert_to_field_resolver.register
def _(_: L, **kwargs: Any) -> GraphQLFilterResolver:
    caller: Field = kwargs["caller"]
    return ModelAttributeResolver(field=caller)


@convert_to_filter_ref.register
def _(ref: L, **kwargs: Any) -> Any:
    caller: Filter = kwargs["caller"]

    user_func = caller.aliases_func

    def aliases(root: Filter, info: GQLInfo[User], *, value: bool) -> dict[str, DjangoExpression]:
        results: dict[str, DjangoExpression] = {}
        if user_func is not None:
            results |= user_func(root, info, value=value)

        results[ref.lookup] = ref
        return results

    caller.aliases_func = aliases
    return ref


@convert_to_filter_resolver.register
def _(ref: L, **kwargs: Any) -> GraphQLFilterResolver:
    caller: Filter = kwargs["caller"]
    return LookupExpressionResolver(lookup_expression=ref, lookup=caller.lookup)


@dataclasses.dataclass(frozen=True, slots=True)
class LookupExpressionResolver:
    """Resolves a filter using a L expression."""

    lookup_expression: L
    lookup: str

    def __call__(self, root: Any, info: GQLInfo, *, value: Any) -> Q:  # noqa: ARG002
        lookup_value = value
        if hasattr(self.lookup_expression, "value"):
            lookup_value = self.lookup_expression.value

        name = f"{self.lookup_expression.lookup}{LOOKUP_SEP}{self.lookup}"
        new_lookup = L(**{name: lookup_value})
        return new_lookup if value else ~new_lookup


@convert_to_order_ref.register
def _(ref: L, **kwargs: Any) -> Any:
    return ref


@convert_to_field_resolver.register
def _(ref: NullablePermissions, **kwargs: Any) -> GraphQLFieldResolver:
    caller: Field = kwargs["caller"]
    resolver = convert_to_field_resolver(caller.ref, **kwargs)
    return NullablePermissionResolver(
        field=caller,
        permission_check=ref.permission_check,
        resolver=resolver,
    )


@convert_to_graphql_type.register
def _(ref: type[StrEnum], **kwargs: Any) -> GraphQLInputType | GraphQLOutputType:
    return get_or_create_graphql_enum(
        name=ref.__name__,
        values={
            str(value.value): GraphQLEnumValue(value=value, description=str(value.value))
            for name, value in ref.__members__.items()
        },
        description=convert_to_description(ref),
    )
