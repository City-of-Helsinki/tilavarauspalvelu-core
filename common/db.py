from typing import Any

from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.search import SearchQuery
from django.db import models

__all__ = [
    "SubqueryArray",
    "SubquerySum",
    "raw_prefixed_query",
]


class SubquerySum(models.Subquery):
    """
    Sum the values of a subquery onto a single value.

    Refs. (https://stackoverflow.com/a/58001368)
    """

    template = "(SELECT SUM(%(sum_field)s) FROM (%(subquery)s) _sum)"
    output_field = models.DecimalField()

    def __init__(
        self,
        queryset: models.QuerySet,
        sum_field: str,
        output_field: models.Field | None = None,
        **kwargs: Any,
    ) -> None:
        kwargs["sum_field"] = sum_field
        super().__init__(queryset, output_field, **kwargs)


class SubqueryArray(models.Subquery):
    """
    Aggregate subquery values into an array that can be returned from it.

    >>> ids = Space.objects.values("id")
    >>> Space.objects.annotate(ids=SubqueryArray(ids, agg_field="id")).values_list("ids", flat=True)
    <QuerySet [[1, 2, 3, ...], [1, 2, 3, ...], ...]>
    """

    template = "(SELECT ARRAY_AGG(%(agg_field)s) FROM (%(subquery)s) _sum)"
    output_field = ArrayField(base_field=models.IntegerField())

    def __init__(
        self,
        queryset: models.QuerySet,
        agg_field: str,
        *,
        output_field: models.Field | None = None,
        **kwargs: Any,
    ) -> None:
        kwargs["agg_field"] = agg_field
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
