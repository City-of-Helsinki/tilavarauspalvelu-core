from typing import Any

from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.search import SearchQuery
from django.db import models

__all__ = [
    "ArrayRemove",
    "ArrayUnnest",
    "raw_prefixed_query",
    "SubqueryArray",
    "SubquerySum",
]


class SubquerySum(models.Subquery):
    """
    Sum the values of a subquery onto a single value.

    Refs. (https://stackoverflow.com/a/58001368)
    """

    template = "(SELECT SUM(%(sum_field)s) FROM (%(subquery)s) %(alias)s)"
    output_field = models.DecimalField()

    def __init__(
        self,
        queryset: models.QuerySet,
        *,
        sum_field: str,
        alias: str = "_sum",
        output_field: models.Field | None = None,
        **kwargs: Any,
    ) -> None:
        kwargs["sum_field"] = sum_field
        kwargs["alias"] = alias
        super().__init__(queryset, output_field, **kwargs)


class SubqueryArray(models.Subquery):
    """
    Aggregate subquery values into an array that can be returned from it.

    Using `distinct=True` will remove duplicates from the array.
    Using `remove_nulls=True` (default) will remove null values from the array.
    Using `coalesce=True` (default) will replace null arrays with an empty array (note `coalesce_output_type`).

    >>> ids = Space.objects.values("id")
    >>> Space.objects.annotate(ids=SubqueryArray(ids, agg_field="id")).values_list("ids", flat=True)
    <QuerySet [[1, 2, 3, ...], [1, 2, 3, ...], ...]>
    """

    template = "(SELECT ARRAY_AGG(%(distinct)s%(agg_field)s) FROM (%(subquery)s) %(alias)s)"
    output_field = ArrayField(base_field=models.IntegerField())

    def __init__(
        self,
        queryset: models.QuerySet,
        agg_field: str,
        *,
        distinct: bool = False,
        include_nulls: bool = False,
        coalesce: bool = True,
        coalesce_output_type: str = "integer",  # https://www.postgresql.org/docs/current/datatype.html#DATATYPE-TABLE
        output_field: models.Field | None = None,
        alias: str = "_array",
        **kwargs: Any,
    ) -> None:
        kwargs["alias"] = alias
        kwargs["agg_field"] = agg_field
        kwargs["distinct"] = "DISTINCT " if distinct else ""
        if not include_nulls:
            self.template = f"ARRAY_REMOVE({self.template}, NULL)"
        if coalesce:
            self.template = f"COALESCE({self.template}, ARRAY[]::{coalesce_output_type}[])"
        if output_field is not None:
            self.output_field = ArrayField(base_field=output_field)
        super().__init__(queryset, self.output_field, **kwargs)


class ArrayRemove(models.Func):
    """
    Removes all elements equal to the given value (arg 2) from the given array (arg 1).
    The array must be one-dimensional. Comparisons are done using `IS NOT DISTINCT FROM` semantics,
    so it is possible to remove NULLs.

    See: https://www.postgresql.org/docs/current/functions-array.html

    >>> ReservationUnit.objects.annotate(ids=ArrayRemove(ArrayAgg("spaces__id"), None))
    """

    function = "ARRAY_REMOVE"
    arity = 2


class ArrayUnnest(models.Func):
    """
    Expands an array into a set of rows. The array's elements are read out in storage order.

    See: https://www.postgresql.org/docs/current/functions-array.html
    """

    function = "UNNEST"
    arity = 1


def raw_prefixed_query(text: str) -> SearchQuery:
    """
    Create a query that searches for each word separately and matched partial words if match is a prefix.
    Remove any whitespace and replace any single quote mark with two quote marks.
    https://www.postgresql.org/docs/current/datatype-textsearch.html#DATATYPE-TSQUERY
    """
    return SearchQuery(
        " | ".join(f"""'{value.replace("'", "''")}':*""" for value in text.split(" ") if value != ""),
        search_type="raw",
    )
