# ruff: noqa: T201
from __future__ import annotations

import dataclasses
import datetime
import inspect
import itertools
import time
import uuid
from decimal import Decimal
from functools import cache
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.core.exceptions import FieldDoesNotExist
from django.core.management import BaseCommand
from django.db import models
from django.db.models import NOT_PROVIDED, ForeignObjectRel
from django.db.models.constants import LOOKUP_SEP
from django.db.models.fields.related import RelatedField
from graphene.types.utils import get_underlying_type
from graphene.utils.str_converters import to_snake_case
from graphene_django import DjangoObjectType
from graphene_django.rest_framework.mutation import SerializerMutationOptions
from graphene_django.types import DjangoObjectTypeOptions
from graphql import FieldNode, GraphQLObjectType, OperationDefinitionNode, SelectionNode, Undefined, parse, print_ast

from tilavarauspalvelu.api.graphql.schema import schema
from utils.date_utils import local_date, local_datetime, local_time

from tests import factories
from tests.factories._base import GenericDjangoModelFactory  # noqa: PLC2701

if TYPE_CHECKING:
    from pathlib import Path

    from graphene.types.objecttype import ObjectTypeOptions


type ModelField = models.Field | models.ForeignObjectRel
type FactoryMap = dict[type[GenericDjangoModelFactory], dict[str, ModelField]]


class Command(BaseCommand):
    help = "Figure out which factories to use for which queries. Should run 'defragment_frontend_queries' first."

    def handle(self, *args: Any, **options: Any) -> None:
        print("Starting matching...")
        started = time.perf_counter()

        gql_path = check_path(settings.BASE_DIR.parent / "graphql", should_be_dir=True)
        customer_file = check_path(gql_path / "customer-queries.graphql", should_be_file=True)
        admin_file = check_path(gql_path / "admin-queries.graphql", should_be_file=True)

        _customer_factories = match_queries_to_factories(customer_file)
        _admin_factories = match_queries_to_factories(admin_file)

        ended = time.perf_counter()
        print(f"Matching done in {ended - started:.2f} seconds.")


@dataclasses.dataclass(frozen=True)
class FactoryInfo:
    """Factory and arguments required to create data for a query"""

    factory: type[GenericDjangoModelFactory]
    """Factory to use to generate the data."""

    args: dict[str, Any]
    """
    Arguments for the factory, matching the queried fields.

    Keys are given in terms that factories expect, i.e. using "__" to reach into nested models.
    Values are set according to the model field that is queried, or "Undefined" if the field is not a model field.
    Non-model fields should be removed from the args and handled separately when using the args for the factory.
    """

    query: str
    """The query that was used to match the factory to the query."""


def check_path(path: Path, *, should_be_file: bool = False, should_be_dir: bool = False) -> Path:
    if not path.exists():
        msg = f"{path} does not exist"
        raise FileNotFoundError(msg)

    if should_be_file and not path.is_file():
        msg = f"{path} is not a file"
        raise FileNotFoundError(msg)

    if should_be_dir and not path.is_dir():
        msg = f"{path} is not a directory"
        raise FileNotFoundError(msg)

    return path


def match_queries_to_factories(file: Path) -> dict[str, dict[str, FactoryInfo]]:
    """Match queries in given file and return a map of the operation name to a map of"""
    print(f"Reading queries from '{file.name}'...")
    document = file.read_text()

    print("Parsing queries to ast...")
    document_node = parse(document, no_location=True)

    print("Matching queries to factories...")
    factory_map: dict[str, dict[str, FactoryInfo]] = {}

    for operation in document_node.definitions:
        if not isinstance(operation, OperationDefinitionNode):
            msg = f"Unhandled definition type: ({type(operation)}) {operation}. Did you forget to defragment first?"
            raise NotImplementedError(msg)

        factories_for_operation = get_factory_info_for_definition(operation)
        factory_map[operation.name.value] = factories_for_operation

    return factory_map


@cache
def factories_by_model() -> dict[type[models.Model], type[GenericDjangoModelFactory]]:
    def predicate(value: Any) -> bool:
        return isinstance(value, type) and issubclass(value, GenericDjangoModelFactory)

    return {factory._meta.model: factory for name, factory in inspect.getmembers(factories, predicate)}


def get_factory_info_for_definition(operation: OperationDefinitionNode) -> dict[str, FactoryInfo]:
    root_type = get_root_type(operation)

    factory_map: dict[str, FactoryInfo] = {}

    for selection in operation.selection_set.selections:
        if not isinstance(selection, FieldNode):
            msg = f"Unhandled selection node type: ({type(selection)}) {selection}"
            raise NotImplementedError(msg)

        selection_set = selection.selection_set
        if selection_set is None:
            msg = "Field has no selection set"
            raise ValueError(msg)

        try:
            factory = get_factory(root_type, selection)
        except Exception:  # noqa: BLE001
            print(f"Skipping '{selection.name.value}' since it doesn't match any factory")
            continue

        args = get_factory_arguments(selection, model=factory._meta.model)

        factory_map[selection.name.value] = FactoryInfo(
            factory=factory,
            args=args,
            query=print_ast(operation),
        )

    return factory_map


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


def get_factory(root_type: GraphQLObjectType, field_node: FieldNode) -> type[GenericDjangoModelFactory]:
    name = field_node.name.value

    object_type = get_graphql_type(name, root_type)

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


def get_graphql_type(name: str, root_type: GraphQLObjectType) -> GraphQLObjectType:
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


def get_factory_arguments(
    selection_node: SelectionNode,
    *,
    model: type[models.Model],
    parent: str = "",  # Lookup from root to this field
    root: str = "",  # Entrypoint field name
) -> dict[str, Any]:
    if not isinstance(selection_node, FieldNode):
        msg = f"Unhandled selection node type: ({type(selection_node)}) {selection_node}"
        raise NotImplementedError(msg)

    name = to_snake_case(selection_node.name.value)

    if name == "edges":
        selection_node = get_connection_node(selection_node)
        field_name = parent

    elif parent:
        field_name = name if parent == root else f"{parent}{LOOKUP_SEP}{name}"

        model_field = get_model_field(model, name)
        if model_field is None:
            # Non-model field, don't need any args for factory.
            return {field_name: Undefined}

        if isinstance(model_field, RelatedField | ForeignObjectRel):
            model: type[models.Model] = model_field.related_model  # type: ignore[assignment]

    else:
        field_name = name
        root = name

    if selection_node.selection_set is None:
        model_field = get_model_field(model, name)
        if model_field is None:
            # Non-model field, don't need any args for factory.
            return {field_name: Undefined}

        # ID fields in GraphLQ are the node ID, not the model ID.
        if name == "id":
            return {field_name: Undefined}

        value = determine_value_for_field(model_field)
        return {field_name: value}

    factory_arguments: dict[str, Any] = {}
    for selection in selection_node.selection_set.selections:
        args = get_factory_arguments(selection, model=model, parent=field_name, root=root)
        factory_arguments |= args

    return factory_arguments


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


def determine_value_for_field(field: ModelField) -> Any:  # noqa: PLR0911, PLR0912
    if field.default != NOT_PROVIDED:
        if callable(field.default):
            return field.default()
        return field.default

    match field:
        case models.CharField():
            if field.choices:
                return field.choices[0][0]
            return "foo"

        case models.TextField():
            return "bar"

        case models.AutoField():
            return next(counter)

        case models.IntegerField():
            if field.choices:
                return field.choices[0][0]
            return 42

        case models.BooleanField():
            if field.default:
                return field.default
            return False

        case models.DateField():
            return local_date()

        case models.DateTimeField():
            return local_datetime()

        case models.TimeField():
            return local_time()

        case models.DurationField():
            return datetime.timedelta()

        case models.EmailField():
            return "admin@example.com"

        case models.URLField():
            return "https://www.example.com"

        case models.UUIDField():
            return uuid.uuid4()

        case models.DecimalField():
            return Decimal(0)

        case models.FloatField():
            return 0.0

        case _:
            msg = f"Field type not implemented: {field}"
            raise NotImplementedError(msg)
