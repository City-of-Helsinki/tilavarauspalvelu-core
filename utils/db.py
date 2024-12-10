from __future__ import annotations

import ast
from inspect import cleandoc
from typing import TYPE_CHECKING, Any, Literal, TypeVar

from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from django.db import migrations, models
from django.db.models import Func
from django.db.transaction import get_connection
from lookup_property import State
from lookup_property.converters.expressions import expression_to_ast
from lookup_property.converters.utils import ast_attribute, ast_function

if TYPE_CHECKING:
    from collections.abc import Collection

__all__ = [
    "ArrayRemove",
    "ArrayUnnest",
    "NowTT",
    "SubqueryArray",
    "SubqueryCount",
    "SubquerySum",
    "text_search",
]


class SubqueryAggregate(models.Subquery):
    template: str = "(SELECT {function}(%(aggregate_field)s) FROM (%(subquery)s) %(alias)s)"
    output_field: models.Field = models.BigIntegerField()

    aggregate: str | None = None
    aggregate_field: str | None = None
    default_alias: str = "_agg"

    def __init__(
        self,
        queryset: models.QuerySet,
        *,
        aggregate_field: str | None = None,
        alias: str | None = None,
        output_field: models.Field | None = None,
        **kwargs: Any,
    ) -> None:
        self.template = self.template.format(function=self.aggregate)
        kwargs["aggregate_field"] = aggregate_field or self.aggregate_field
        kwargs["alias"] = alias or self.default_alias
        super().__init__(queryset, output_field, **kwargs)


class SubqueryCount(SubqueryAggregate):
    """
    Count how many rows are returned from a subquery.
    Should be used instead of "models.Count" when there might be collisions
    between counted related objects and filter conditions.

    >>> class Foo(models.Model):
    >>>     number = models.IntegerField()
    >>>
    >>> class Bar(models.Model):
    >>>     number = models.IntegerField()
    >>>     example = models.ForeignKey(Foo, on_delete=models.CASCADE, related_name="bars")
    >>>
    >>> foo = Foo.objects.create(number=1)
    >>> Bar.objects.create(example=foo, number=2)
    >>> Bar.objects.create(example=foo, number=2)
    >>>
    >>> foo = (
    >>>     Foo.objects.annotate(count=models.Count("bars"))
    >>>     .filter(bars__number=2)
    >>>     .first()
    >>> )
    >>> assert foo.count == 2

    This fails and asserts that count is 4. The reason is that Bar objects are
    joined twice: once for the count, and once for the filter. Django does not
    reuse the join, since it is not aware that the join is the same.

    Therefore, do this instead:

    >>> foo = (
    >>>     Foo.objects.annotate(
    >>>         count=SubqueryCount(
    >>>             Bar.objects.filter(example=models.OuterRef("id")).values("id")
    >>>         )
    >>>     )
    >>>     .filter(bars__number=2)
    >>>     .first()
    >>> )
    """

    aggregate = "COUNT"
    aggregate_field = "*"
    default_alias = "_count"


class SubquerySum(SubqueryAggregate):
    """
    Sum the values of a subquery onto a single value.

    Refs. (https://stackoverflow.com/a/58001368)
    """

    aggregate = "SUM"
    default_alias = "_sum"


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
        remove_nulls: bool = True,
        coalesce: bool = True,
        coalesce_output_type: str = "integer",  # https://www.postgresql.org/docs/current/datatype.html#DATATYPE-TABLE
        output_field: models.Field | None = None,
        alias: str = "_array",
        **kwargs: Any,
    ) -> None:
        kwargs["alias"] = alias
        kwargs["agg_field"] = agg_field
        kwargs["distinct"] = "DISTINCT " if distinct else ""
        if remove_nulls:
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


class NowTT(Func):  # TT = Time Travel, as in "time travel tests"
    """Same as `functions.Now()`, but can be offset during testing."""

    template = "NOW_TT()"  # Function created in migrations!
    output_field = models.DateTimeField()

    @classmethod
    def set_offset(cls, *, seconds: int, using: str | None = None) -> None:
        """
        Set the database offset for the current time.

        :param seconds: The offset in seconds. Can be negative.
        :param using: The database alias to use.
        """
        with get_connection(using).cursor() as cursor:
            cursor.execute(
                "UPDATE testing_configurations SET global_time_offset_seconds = %s WHERE id = 1;",
                params=[str(seconds)],
            )

    @classmethod
    def migration(cls) -> migrations.RunSQL:
        return migrations.RunSQL(sql=cls.__forward_sql(), reverse_sql=cls.__reverse_sql())

    @classmethod
    def __forward_sql(cls) -> str:
        return cleandoc(
            """
            CREATE TABLE IF NOT EXISTS testing_configurations (
                id BIGSERIAL PRIMARY KEY NOT NULL,
                global_time_offset_seconds BIGINT NOT NULL
            );

            INSERT INTO testing_configurations (id, global_time_offset_seconds) VALUES (1, 0) ON CONFLICT DO NOTHING;

            -- Gets the current time in the database's, but can be offset during testing.
            CREATE OR REPLACE FUNCTION NOW_TT()
            RETURNS TIMESTAMP WITH TIME ZONE
            AS
            $$
            BEGIN
                -- See `django.db.models.functions.datetime.Now.as_postgresql`
                RETURN STATEMENT_TIMESTAMP() + (
                    select global_time_offset_seconds
                    from testing_configurations
                    limit 1
                ) * interval '1 second';
            END;
            $$
            LANGUAGE plpgsql STABLE PARALLEL SAFE STRICT;
            """
        )

    @classmethod
    def __reverse_sql(cls) -> str:
        return cleandoc(
            """
            DROP TABLE IF EXISTS testing_configurations;
            DROP FUNCTION IF EXISTS NOW_TT;
            """
        )


@expression_to_ast.register
def _(_: NowTT, state: State) -> ast.Call:
    """Django ORM -> Python converter for lookup properties containing NowTT."""
    state.imports.add("datetime")
    kwargs: dict[str, ast.Attribute] = {}

    if state.use_tz:
        kwargs["tz"] = ast_attribute("datetime", "timezone", "utc")

    return ast_function("now", ["datetime", "datetime"], **kwargs)


TQuerySet = TypeVar("TQuerySet")


def text_search(
    qs: TQuerySet,
    fields: Collection[str],
    text: str,
    *,
    language: Literal["finnish", "english", "swedish"] = "finnish",
    or_contains: bool = False,
) -> TQuerySet:
    """
    Query with postgres full text search.
    https://www.postgresql.org/docs/current/datatype-textsearch.html#DATATYPE-TSQUERY

    :param qs: QuerySet to filter.
    :param fields: Fields to search.
    :param text: Text to search for.
    :param language: Language to search in.
    :param or_contains: Search results with a LIKE query in addition to full text search.
                        This makes the search slower, but complements full text search with partial matches.
    """
    # If this becomes slow, look into optimisation strategies here:
    # https://docs.djangoproject.com/en/5.1/ref/contrib/postgres/search/#performance
    vector = SearchVector(*fields, config=language)

    search = build_search(text)
    query = SearchQuery(value=search, config=language, search_type="raw")
    rank = SearchRank(vector, query)
    q = models.Q(ts_vector=query)
    if or_contains:
        for field in fields:
            q |= models.Q(**{f"{field}__icontains": text})
    return qs.annotate(ts_vector=vector, ts_rank=rank).filter(q)


def build_search(text: str, *, separator: Literal["|", "&", "<->"] = "|") -> str:
    """
    Build raw postgres full text search query from text.

    Quote search terms and do prefix matching.
    Match all search terms with the given operator:
      | = or
      & = and
      <-> = Followed by
      <3> = Followed by less than 3 "words" away (<1> same as <->)

    Replace single quotes and hyphens in words with spaces so they are treated as whitespace in the search,
    e.g. "Moe's" becomes "Moe s" and "3D-printer" becomes "3D printer".

    Ref. https://www.postgresql.org/docs/current/datatype-textsearch.html#DATATYPE-TSQUERY
    """
    search_terms: list[str] = []
    for value in text.replace("'", " ").replace("-", " ").split(" "):
        if value:
            value = f"'{value}':*"
            search_terms.append(value)
    return f" {separator} ".join(search_terms)
