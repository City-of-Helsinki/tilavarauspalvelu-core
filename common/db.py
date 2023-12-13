from django.contrib.postgres.search import SearchQuery
from django.db.models import DecimalField, Subquery


class SubQuerySum(Subquery):
    """Refs. (https://stackoverflow.com/a/58001368)"""

    template = "(SELECT SUM(%(sum_field)s) FROM (%(subquery)s) _sum)"
    output_field = DecimalField()

    def __init__(self, queryset, output_field=None, *, sum_field="", **extra):
        extra["sum_field"] = sum_field
        super().__init__(queryset, output_field, **extra)


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
