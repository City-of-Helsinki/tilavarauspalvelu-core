from __future__ import annotations

import dataclasses
import datetime
import inspect
import itertools
import random
import string
import uuid
from decimal import Decimal
from functools import cache
from typing import TYPE_CHECKING, Any

from django.core.exceptions import FieldDoesNotExist
from django.db import models
from django.db.models import NOT_PROVIDED, ForeignObjectRel
from django.db.models.fields.related import RelatedField
from graphene.types.utils import get_underlying_type
from graphene.utils.str_converters import to_snake_case
from graphene_django import DjangoObjectType
from graphene_django.rest_framework.mutation import SerializerMutationOptions
from graphene_django.types import DjangoObjectTypeOptions
from graphql import (
    FieldNode,
    GraphQLInputObjectType,
    GraphQLObjectType,
    NonNullTypeNode,
    OperationDefinitionNode,
    OperationType,
    SelectionNode,
    Undefined,
    parse,
    print_ast,
    value_from_ast_untyped,
)

from tilavarauspalvelu.api.graphql.schema import schema
from utils.date_utils import local_date, local_datetime, local_time

from tests import factories
from tests.factories._base import GenericDjangoModelFactory

if TYPE_CHECKING:
    from pathlib import Path

    from graphene.types.objecttype import ObjectTypeOptions


type ModelField = models.Field | models.ForeignObjectRel
type FactoryMap = dict[type[GenericDjangoModelFactory], dict[str, ModelField]]


@dataclasses.dataclass(frozen=True)
class QueryInfo:
    """Info about a query used to create data for it and execute it"""

    query: str
    """The query where the factory needs to be used."""

    operation: OperationType
    """The operation type of the query."""

    typename: str
    """Name of the GraphQL object type for the root operation. Can be used to generate Node IDs."""

    variables: dict[str, str]
    """Variables used in the operation."""

    factory: type[GenericDjangoModelFactory] | None
    """Factory to use to generate the data."""

    factory_args: dict[str, Any]
    """
    Arguments for the factory, matching the queried fields.

    Keys are given in terms that factories expect, i.e. using "__" to reach into nested models.
    Values are set according to the model field that is queried. Non-model fields are skipped.
    """


def match_queries_to_factories(file: Path) -> dict[str, list[QueryInfo]]:
    """Match queries in given file and return a map of the operation name to a map of"""
    document = file.read_text(encoding="utf-8")

    document_node = parse(document, no_location=True)

    factory_map: dict[str, list[QueryInfo]] = {}

    for operation in document_node.definitions:
        if not isinstance(operation, OperationDefinitionNode):
            msg = f"Unhandled definition type: ({type(operation)}) {operation}. Did you forget to defragment first?"
            raise NotImplementedError(msg)

        factory_map[operation.name.value] = get_factory_info_for_definition(operation)

    return factory_map


@cache
def factories_by_model() -> dict[type[models.Model], type[GenericDjangoModelFactory]]:
    def predicate(value: Any) -> bool:
        return isinstance(value, type) and issubclass(value, GenericDjangoModelFactory)

    return {factory._meta.model: factory for name, factory in inspect.getmembers(factories, predicate)}


def get_factory_info_for_definition(operation: OperationDefinitionNode) -> list[QueryInfo]:
    root_type = get_root_type(operation)

    factory_info: list[QueryInfo] = []

    variables = get_operation_variables(operation)

    for selection in operation.selection_set.selections:
        if not isinstance(selection, FieldNode):
            msg = f"Unhandled selection node type: ({type(selection)}) {selection}"
            raise NotImplementedError(msg)

        if selection.selection_set is None:
            msg = "Operation has no selected fields"
            raise ValueError(msg)

        factory_args: dict[str, Any] = {}

        try:
            factory = get_factory(root_type, selection)
        except Exception:  # noqa: BLE001
            factory = None
        else:
            for selection_node in selection.selection_set.selections:
                factory_args |= get_factory_arguments(selection_node, model=factory._meta.model)

            ensure_same_pks_and_ids(factory_args)

        typename = get_root_operation_typename(root_type, selection)

        factory_info.append(
            QueryInfo(
                query=print_ast(operation),  # Need the whole operation, not just this query!
                operation=operation.operation,
                typename=typename,
                variables=variables,
                factory=factory,
                factory_args=factory_args,
            )
        )

    return factory_info


def get_root_type(operation: OperationDefinitionNode) -> GraphQLObjectType:
    match operation.operation.value:
        case "query":
            root_type = schema.graphql_schema.query_type

        case "mutation":
            root_type = schema.graphql_schema.mutation_type

        case _:
            msg = f"Unhandled operation: '{operation}'"
            raise NotImplementedError(msg)

    if root_type is None:
        msg = f"No root type found for operation: '{operation.operation.value}'"
        raise NotImplementedError(msg)

    return root_type


def get_operation_variables(operation: OperationDefinitionNode) -> dict[str, Any]:
    variables = {}
    for variable in operation.variable_definitions:
        # Don't include optional variables to make testing easier
        if not isinstance(variable.type, NonNullTypeNode):
            continue

        variables[variable.variable.name.value] = Undefined

        # If input has a default value, use it
        if variable.default_value is not None:
            variables[variable.variable.name.value] = value_from_ast_untyped(variable.default_value)

    return variables


def get_factory(root_type: GraphQLObjectType, field_node: FieldNode) -> type[GenericDjangoModelFactory]:
    name = field_node.name.value

    object_type = get_object_type_for_root_operation(name, root_type)

    graphene_type: DjangoObjectType | None = getattr(object_type, "graphene_type", None)
    if graphene_type is None:
        msg = f"No graphene type found for '{name}'"
        raise TypeError(msg)

    options: ObjectTypeOptions = graphene_type._meta

    match root_type.name:
        case "Query":
            options: DjangoObjectTypeOptions
            model: type[models.Model] = options.model

        case "Mutation":
            options: SerializerMutationOptions
            model: type[models.Model] = options.model_class

        case _:
            msg = f"Root type '{root_type.name}' is not a valid root type"
            raise TypeError(msg)

    if not issubclass(model, models.Model):
        msg = f"Graphene type '{name}' does not have a Django model"
        raise TypeError(msg)

    factory = factories_by_model().get(model)
    if factory is None:
        msg = f"No factory found for model '{model}'"
        raise KeyError(msg)

    return factory


def get_object_type_for_root_operation(name: str, root_type: GraphQLObjectType) -> GraphQLObjectType:
    entrypoint = root_type.fields.get(name)
    if entrypoint is None:
        msg = f"No entrypoint found for '{name}'"
        raise KeyError(msg)

    gql_type = get_underlying_type(entrypoint.type)
    if gql_type.name.endswith("Connection"):
        edge_type = get_underlying_type(gql_type.fields["edges"].type)
        node_type = get_underlying_type(edge_type.fields["node"].type)
        gql_type = node_type

    return gql_type


def get_input_object_type_for_root_operation(name: str, root_type: GraphQLObjectType) -> GraphQLInputObjectType:
    entrypoint = root_type.fields.get(name)
    if entrypoint is None:
        msg = f"No entrypoint found for '{name}'"
        raise KeyError(msg)

    input_argument = entrypoint.args.get("input")
    if input_argument is None:
        msg = f"No 'input' argument found for '{name}'"
        raise KeyError(msg)

    return get_underlying_type(input_argument.type)


def get_root_operation_typename(root_type: GraphQLObjectType, field_node: FieldNode) -> str:
    if root_type.name == "Mutation":
        input_object_type = get_input_object_type_for_root_operation(field_node.name.value, root_type)
        return input_object_type.name

    object_type = get_object_type_for_root_operation(field_node.name.value, root_type)
    return object_type.name


def ensure_same_pks_and_ids(args: dict[str, Any]) -> None:
    for key, value in args.items():
        if key == "pk" and "id" in args:
            args["id"] = value

        if key.endswith("__pk"):
            common = key.removesuffix("__pk")
            key = f"{common}__id"  # noqa: PLW2901
            if key in args:
                args[key] = value


def get_factory_arguments(
    selection_node: SelectionNode,
    *,
    model: type[models.Model],
    lookup: str = "",
) -> dict[str, Any]:
    if not isinstance(selection_node, FieldNode):
        msg = f"Unhandled selection node type: ({type(selection_node)}) {selection_node}"
        raise NotImplementedError(msg)

    name = to_snake_case(selection_node.name.value)

    if name == "edges":
        selection_node = get_connection_node(selection_node)

    else:
        model_field = get_model_field(model, name)
        if model_field is None:
            # Non-model field, don't need any args for factory.
            return {}

        lookup = f"{lookup}__{name}" if lookup else name

        if selection_node.selection_set is None:
            value = determine_value_for_field(model_field)
            return {lookup: value}

        if isinstance(model_field, RelatedField | ForeignObjectRel):
            model: type[models.Model] = model_field.related_model  # type: ignore[assignment]

    factory_args: dict[str, Any] = {}
    for selection in selection_node.selection_set.selections:
        factory_args |= get_factory_arguments(selection, model=model, lookup=lookup)

    return factory_args


def get_model_field(model: type[models.Model], name: str) -> ModelField | None:
    if name == "pk":
        return model._meta.pk
    try:
        return model._meta.get_field(name)
    except FieldDoesNotExist:
        return None


def get_connection_node(field_node: FieldNode) -> FieldNode:
    if field_node.selection_set is None:
        msg = "Edges selection set is None"
        raise ValueError(msg)

    for selection in field_node.selection_set.selections:
        if not isinstance(selection, FieldNode):
            msg = f"Unhandled selection node type: ({type(selection)}) {selection}"
            raise NotImplementedError(msg)

        if selection.name.value == "node":
            node = selection
            break

    else:
        msg = "Edges selection set does not contain a node selection"
        raise ValueError(msg)

    if node.selection_set is None:
        msg = "Node does not have selections"
        raise ValueError(msg)

    return node


counter = itertools.count()
chars = string.ascii_letters + string.digits


def determine_value_for_field(field: ModelField) -> Any:  # noqa: PLR0911, PLR0912
    if field.default != NOT_PROVIDED:
        if callable(field.default):
            return field.default()
        return field.default

    match field:
        case models.EmailField():
            return "admin@example.com"

        case models.URLField():
            return "https://www.example.com"

        case models.CharField():
            if field.choices:
                return field.choices[0][0]
            return "".join(random.choices(chars, k=10))

        case models.TextField():
            return "".join(random.choices(chars, k=10))

        case models.AutoField() | models.ForeignKey():
            return next(counter)

        case models.IntegerField():
            if field.choices:
                return field.choices[0][0]
            return random.randint(0, 100)

        case models.BooleanField():
            return False

        case models.DateTimeField():
            return local_datetime()

        case models.DateField():
            return local_date()

        case models.TimeField():
            return local_time()

        case models.DurationField():
            return datetime.timedelta()

        case models.UUIDField():
            return uuid.uuid4()

        case models.DecimalField():
            return Decimal(random.randint(0, 100))

        case models.FloatField():
            return float(random.randint(0, 100))

        case _:
            msg = f"Field type not implemented: {field}"
            raise NotImplementedError(msg)
