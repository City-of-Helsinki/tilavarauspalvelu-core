from django.db.models import DecimalField, Subquery


class SubQuerySum(Subquery):
    """Refs. (https://stackoverflow.com/a/58001368)"""

    template = "(SELECT SUM(%(sum_field)s) FROM (%(subquery)s) _sum)"
    output_field = DecimalField()

    def __init__(self, queryset, output_field=None, *, sum_field="", **extra):
        extra["sum_field"] = sum_field
        super().__init__(queryset, output_field, **extra)
