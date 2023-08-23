from typing import Any, Dict, List, Union

import graphene
from django.db.models import Prefetch, QuerySet


class QueryPerformanceOptimizerMixin:
    """Mixin for GraphQL database query optimization

    Inherit from this class and add "QueryOptimization" to class.

    QueryOptimization must include the following fields:
        * field_name (str) = The name of the query field
        * query_optimization (dict) = dict of field names mapped to optimizations

    query_optimizations values must be 2-tuples with "optimization type" as first value
    and "model field name" or a dict as second value.
    Dict as second value is only supported for "prefetch_related" fields as it will generate a `Prefetch()` object.

    Dict as optimization value must include following keys:
        * field_name (str) = name of model field name
        * base_queryset (QuerySet) = Django model queryset for the field_name
        * child_optimizations (dict) = dict with deeper optimizations

    child_optimizations must match the `query_optimization` dict structure.

    Currently supported optimizations are:
        "annotate" = adds given annotation to query
        "select" = adds field name to "select_related" function
        "prefetch" = adds field name or prefetch (see above) to "prefetch_related" function

        Following only for deeper optimizations (not first level fields)

        "select_with_child_optimizations" = same as select but may add deeper selects if some child fields are selected
        "select_for_parent" = same as select but adds the deeper select field to parent query's select_related
        "prefetch_for_parent" = same as prefetch but adds the deeper prefetch to parent querys prefetch_related
    """

    @classmethod
    def get_queryset(cls, queryset: QuerySet, info: graphene.ResolveInfo):
        query = super().get_queryset(queryset, info)
        query_optimizations = cls.QueryOptimization.query_optimization
        field_name = cls.QueryOptimization.field_name
        operation = info.operation
        query_selections = None
        edge_selections = None
        child_selections = None

        # TODO: Currently, this optimization only supports queries with one node
        # If multiple nodes are added to query, this implementation does not
        # know how to optimize the n:th query!

        # Start parsing GraphQL query structure
        for selection in operation.selection_set.selections:
            if selection.name.value == field_name:
                query_selections = selection.selection_set.selections
                break

        # Query selections found, find edges
        if query_selections:
            for selection in query_selections:
                if selection.name.value == "edges":
                    edge_selections = selection.selection_set.selections
                    break

        # Edges found, find nodes next
        if edge_selections:
            for selection in edge_selections:
                if selection.name.value == "node":
                    child_selections = selection.selection_set.selections
                    break

        # Children found, optimize queries for selected fields
        if child_selections:
            query = cls._optimize_query_with_selected_child_elements(child_selections, query_optimizations, query)

        return query

    @staticmethod
    def _optimize_query_with_selected_child_elements(  # noqa: C901
        children: List[Any], optimizations: Dict[str, Any], queryset: QuerySet
    ) -> List[Any]:
        """Build and apply query optimization from graphql query selections"""
        annotations = []
        selects = []
        prefetches = []

        for child in children:
            optimization_type, optimization_value = optimizations.get(child.name.value, (None, None))

            if optimization_type == "select":
                selects.append(optimization_value)

            if optimization_type == "annotate":
                annotations.append(optimization_value)

            if optimization_type == "prefetch":
                # CASE: Simple optimization, append field name to prefetch list
                if isinstance(optimization_value, str):
                    prefetches.append(optimization_value)

                # CASE: Advanced optimization logic
                if isinstance(optimization_value, dict):
                    # CASE: Has child fields, check for deeper optimizations
                    if child.selection_set.selections:
                        (
                            _,
                            _,
                            prefetch,
                        ) = QueryPerformanceOptimizerMixin._compile_prefetch(
                            children=child.selection_set.selections, **optimization_value
                        )

                        # If no child prefetches, just prefetch the base model
                        if not prefetch:
                            prefetch = optimization_value.get("field_name")

                        prefetches.append(prefetch)

                    # CASE: No child fields, simply add field name to prefetch list to fetch base model
                    else:
                        prefetches.append(optimization_value.get("field_name"))

        # Remove duplicates
        # TODO: multiple `Prefetch` objects has not been tested on the same level
        # `set()` may remove these as "duplicates". If it does, some more elaborate logic is required
        # for removing duplicates.
        annotations = list(set(annotations))
        selects = list(set(selects))
        prefetches = list(set(prefetches))

        if annotations:
            queryset = queryset.annotate(*annotations)

        if selects:
            queryset = queryset.select_related(*selects)

        if prefetches:
            queryset = queryset.prefetch_related(*prefetches)

        return queryset

    @staticmethod
    def _compile_prefetch(
        field_name: str,
        children: List[Any],
        child_optimizations: Dict[str, Any],
        base_queryset: Union[QuerySet, None] = None,
    ):
        """Compile prefetch and other optimizations for parent query"""
        prefetch = None
        annotations = []
        selects = []
        parent_selects = []
        prefetches = []
        parent_prefetches = []

        for child in children:
            optimization = child_optimizations.get(child.name.value, None)

            if optimization:
                optimization_type, optimization_value = optimization

                QueryPerformanceOptimizerMixin._handle_optimization(
                    optimization_type,
                    optimization_value,
                    child,
                    annotations,
                    selects,
                    prefetches,
                    parent_selects,
                    parent_prefetches,
                )

        # Remove duplicates
        # TODO: multiple `Prefetch` objects has not been tested on the same level
        # `set()` may remove these as "duplicates". If it does, some more elaborate logic is required
        # for removing duplicates.
        annotations = list(set(annotations))
        selects = list(set(selects))
        prefetches = list(set(prefetches))

        if annotations or selects or prefetches:
            if annotations:
                base_queryset = base_queryset.annotate(*annotations)

            if selects:
                base_queryset = base_queryset.select_related(*selects)

            if prefetches:
                base_queryset = base_queryset.prefetch_related(*prefetches)

            prefetch = Prefetch(field_name, queryset=base_queryset)

        return (
            parent_selects,
            parent_prefetches,
            prefetch,
        )

    @staticmethod
    def _handle_optimization(  # noqa: C901
        optimization_type: str,
        optimization_value: Union[str, dict],
        child,
        annotations,
        selects,
        prefetches,
        parent_selects,
        parent_prefetches,
    ):
        """Add optimization to correct list of parent optimizations"""

        if optimization_type == "select":
            selects.append(optimization_value)

        if optimization_type == "annotate":
            annotations.append(optimization_value)

        if optimization_type == "prefetch":
            # CASE: Simple optimization, append field name to prefetch list
            if isinstance(optimization_value, str):
                prefetches.append(optimization_value)

            # CASE: Advanced optimization logic
            if isinstance(optimization_value, dict):
                # CASE: Has child fields, check for deeper optimizations
                if child.selection_set.selections:
                    (
                        child_selects,
                        child_prefetches,
                        child_prefetch,
                    ) = QueryPerformanceOptimizerMixin._compile_prefetch(
                        children=child.selection_set.selections, **optimization_value
                    )

                    prefetches.append(child_prefetch)
                    selects += child_selects
                    prefetches += child_prefetches

                # CASE: No child fields, simply add field name to prefetch list to fetch base model
                else:
                    prefetches.append(optimization_value.get("field_name"))

        if optimization_type == "select_with_child_optimizations":
            # CASE: Has child fields, check if deeper optimizations are required
            if child.selection_set.selections:
                (
                    child_selects,
                    child_prefetches,
                    _,
                ) = QueryPerformanceOptimizerMixin._compile_prefetch(
                    children=child.selection_set.selections, **optimization_value
                )

                selects += child_selects
                prefetches += child_prefetches

            # Always add parent to select related list
            selects.append(optimization_value.get("field_name"))

        if optimization_type == "select_for_parent":
            parent_selects.append(optimization_value)

        if optimization_type == "prefetch_for_parent":
            # CASE: Simple optimization, append field name to prefetch list
            if isinstance(optimization_value, str):
                parent_prefetches.append(optimization_value)

            # CASE: Advanced optimization logic
            if isinstance(optimization_value, dict):
                # CASE: Includes child fileds, look deeper for further optimization
                if child.selection_set.selections:
                    always_prefetch = optimization_value.pop("always_prefetch", False)

                    # Deeper nested prefetch for parent is not implemented yet as no examples of
                    # this emerged yet.
                    (
                        _,
                        _,
                        child_prefetch,
                    ) = QueryPerformanceOptimizerMixin._compile_prefetch(
                        children=child.selection_set.selections, **optimization_value
                    )

                    # CASE: Prefetch was compiled with base_queryset
                    if child_prefetch:
                        parent_prefetches.append(child_prefetch)

                    # CASE: Prefetch was not compiled
                    # This is needed for cases where a prefetch must be performed.
                    # For example when Model has a OneToOne field.
                    elif always_prefetch:
                        parent_prefetches.append(
                            Prefetch(
                                optimization_value.get("field_name"),
                                queryset=optimization_value.get("base_queryset"),
                            )
                        )

                    # CASE: No child fields, simply append prefetch to parent to fetch base model
                    else:
                        parent_prefetches.append(optimization_value.get("field_name"))

                # CASE: No child fields, simply append prefetch to parent to fetch base model
                else:
                    parent_prefetches.append(optimization_value.get("field_name"))
