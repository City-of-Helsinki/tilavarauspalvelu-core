from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.db import models
from graphql import GraphQLInputType, GraphQLOutputType
from lookup_property import L
from lookup_property.field import LookupPropertyField
from undine.converters import (
    convert_to_description,
    convert_to_field_ref,
    convert_to_field_resolver,
    convert_to_filter_ref,
    convert_to_filter_resolver,
    convert_to_graphql_argument_map,
    convert_to_graphql_type,
    convert_to_order_ref,
    is_field_nullable,
    is_many,
)
from undine.resolvers import FilterQExpressionResolver, ModelAttributeResolver
from undine.utils.model_utils import determine_output_field, get_model_field

if TYPE_CHECKING:
    from undine import Field, Filter
    from undine.optimizer import OptimizationData
    from undine.typing import GraphQLFilterResolver

    from tilavarauspalvelu.typing import GQLInfo


@convert_to_graphql_type.register
def _(ref: L, **kwargs: Any) -> GraphQLInputType | GraphQLOutputType:
    lookup: LookupPropertyField = get_model_field(model=kwargs["model"], lookup=f"_{ref.lookup}")  # type: ignore[assignment]
    expr = lookup.target_property.expression
    determine_output_field(expr, model=kwargs["model"])
    output_field = expr.output_field
    return convert_to_graphql_type(output_field, **kwargs)


@convert_to_description.register
def _(_: L, **kwargs: Any) -> str | None:
    return None


@is_field_nullable.register
def _(ref: L, **kwargs: Any) -> bool:
    lookup: LookupPropertyField = get_model_field(model=kwargs["model"], lookup=f"_{ref.lookup}")  # type: ignore[assignment]
    expr = lookup.target_property.expression
    determine_output_field(expr, model=kwargs["model"])
    output_field = expr.output_field
    return is_field_nullable(output_field, **kwargs)


@is_many.register
def _(ref: L, **kwargs: Any) -> bool:
    lookup: LookupPropertyField = get_model_field(model=kwargs["model"], lookup=f"_{ref.lookup}")  # type: ignore[assignment]
    expr = lookup.target_property.expression
    determine_output_field(expr, model=kwargs["model"])
    output_field = expr.output_field
    return is_many(output_field, **kwargs)


@convert_to_field_ref.register
def _(ref: L, **kwargs: Any) -> Any:
    caller: Field = kwargs["caller"]

    def optimizer_func(field: Field, data: OptimizationData, info: GQLInfo) -> None:
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
    caller.required_aliases[ref.lookup] = ref
    return ref


@convert_to_filter_resolver.register
def _(ref: L, **kwargs: Any) -> GraphQLFilterResolver:
    return FilterQExpressionResolver(q_expression=models.Q(ref))


@convert_to_order_ref.register
def _(ref: L, **kwargs: Any) -> Any:
    return ref
