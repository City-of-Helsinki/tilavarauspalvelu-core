# ruff: noqa: T201, RUF100
from __future__ import annotations

import dataclasses
import time
from itertools import chain
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.core.management import BaseCommand
from graphql import (
    DocumentNode,
    FieldNode,
    FragmentDefinitionNode,
    FragmentSpreadNode,
    NameNode,
    Node,
    OperationDefinitionNode,
    OperationType,
    SelectionSetNode,
    parse,
    print_ast,
)

from utils.utils import check_path

if TYPE_CHECKING:
    from pathlib import Path


class Command(BaseCommand):
    help = "Defragment frontend queries"

    def handle(self, *args: Any, **options: Any) -> None:
        print("Starting defragmentation...")
        started = time.perf_counter()

        gql_path = check_path(settings.BASE_DIR.parent / "gql-pluck-output", should_be_dir=True)
        customer_file = check_path(gql_path / "customer-queries.graphql", should_be_file=True)
        admin_file = check_path(gql_path / "admin-queries.graphql", should_be_file=True)

        defragment_queries_in_file(customer_file)
        defragment_queries_in_file(admin_file)

        ended = time.perf_counter()
        print(f"Defragmentation done in {ended - started:.2f} seconds.")


OPERATION_VALUE_MAP = {
    OperationType.QUERY: 1,
    OperationType.MUTATION: 2,
    OperationType.SUBSCRIPTION: 3,
}


def defragment_queries_in_file(path: Path) -> None:
    print(f"Reading queries from '{path.name}'...")
    document = path.read_text(encoding="utf-8")

    print(f"Defragmenting queries in '{path.name}'...")
    queries = parse_queries(document)

    print(f"Saving queries to '{path.name}'...")
    path.write_text(queries, encoding="utf-8")


@dataclasses.dataclass(slots=True, frozen=True)
class FragmentsAndOperations:
    operations: dict[str, OperationDefinitionNode] = dataclasses.field(default_factory=dict)
    fragments: dict[str, FragmentDefinitionNode] = dataclasses.field(default_factory=dict)


def parse_queries(document: str) -> str:
    print("Parsing queries to ast...")
    node = parse(document, no_location=True)

    print("Separating fragments and operations...")
    data = separate_fragments_and_nodes(node)

    for operation in data.operations.values():
        print(f"Defragmenting operation '{operation.name.value}'...")
        replace_fragments(operation, fragments=data.fragments)

        print(f"Combining duplicate fields in operation '{operation.name.value}'...")
        combine_duplicate_fields(operation)

    def predicate(op: OperationDefinitionNode) -> tuple[int, str]:
        return OPERATION_VALUE_MAP[op.operation], op.name.value

    print("Printing queries to text...")
    operations = (print_ast(operation) for operation in sorted(data.operations.values(), key=predicate))
    return "\n\n".join(operation for operation in operations)


def separate_fragments_and_nodes(node: DocumentNode) -> FragmentsAndOperations:
    data = FragmentsAndOperations()

    for definition in node.definitions:
        match definition:
            case OperationDefinitionNode():
                definition: OperationDefinitionNode

                if not isinstance(definition.name, NameNode):
                    msg = "Operations must have a name"
                    raise TypeError(msg)

                name = definition.name.value

                if name in data.operations:
                    msg = f"Operation '{name}' already defined"
                    raise KeyError(msg)

                data.operations[name] = definition

            case FragmentDefinitionNode():
                definition: FragmentDefinitionNode

                if not isinstance(definition.name, NameNode):
                    msg = "Fragments must have a name"
                    raise TypeError(msg)

                name = definition.name.value

                if name in data.fragments:
                    msg = f"Fragment '{name}' already defined"
                    raise KeyError(msg)

                data.fragments[name] = definition

            case _:
                raise NotImplementedError

    return data


def replace_fragments(node: Node, *, fragments: dict[str, FragmentDefinitionNode], parent: Node | None = None) -> None:
    match node:
        case OperationDefinitionNode():
            node: OperationDefinitionNode
            for selection in node.selection_set.selections:
                replace_fragments(selection, fragments=fragments, parent=node)

        case FieldNode():
            node: FieldNode
            if node.selection_set is not None:
                for selection in node.selection_set.selections:
                    replace_fragments(selection, fragments=fragments, parent=node)

        case FragmentSpreadNode():
            node: FragmentSpreadNode
            fragment = fragments.get(node.name.value)
            if fragment is None:
                msg = f"Fragment '{node.name.value}' not found"
                raise KeyError(msg)

            for selection in fragment.selection_set.selections:
                replace_fragments(selection, fragments=fragments, parent=fragment)

            if parent is None:
                msg = "Parent node is required"
                raise ValueError(msg)

            selection_set = getattr(parent, "selection_set", None)
            if not isinstance(selection_set, SelectionSetNode):
                msg = "Parent node does not have a selection set"
                raise TypeError(msg)

            selections = (selection for selection in selection_set.selections if selection != node)
            selection_set.selections = tuple(chain(selections, fragment.selection_set.selections))

        case _:
            msg = f"Unhandled node type: ({type(node)}) {node}"
            raise NotImplementedError(msg)


def combine_duplicate_fields(node: Node) -> None:
    match node:
        case OperationDefinitionNode():
            node: OperationDefinitionNode

            deduplicate_fields(node)

            for selection in node.selection_set.selections:
                combine_duplicate_fields(selection)

        case FieldNode():
            node: FieldNode
            if node.selection_set is not None:
                deduplicate_fields(node)

                for selection in node.selection_set.selections:
                    combine_duplicate_fields(selection)

        case _:
            msg = f"Unhandled node type: ({type(node)}) {node}"
            raise NotImplementedError(msg)


def deduplicate_fields(node: OperationDefinitionNode | FieldNode) -> None:
    if node.selection_set is None:
        return

    field_map: dict[str, FieldNode] = {}

    for field in node.selection_set.selections:
        if not isinstance(field, FieldNode):
            msg = f"Unhandled selection node type: ({type(field)}) {field}"
            raise NotImplementedError(msg)

        name = field.name.value
        if field.alias is not None:
            name = field.alias.value

        if name not in field_map:
            field_map[name] = field
            continue

        current_field = field_map[name]
        if current_field.selection_set is None or field.selection_set is None:
            continue

        selections = chain(current_field.selection_set.selections, field.selection_set.selections)
        current_field.selection_set.selections = tuple(selections)

    node.selection_set.selections = tuple(field_map.values())  # type: ignore[assignment]
