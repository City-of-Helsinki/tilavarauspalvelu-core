from django.db import models

__all__ = [
    "SQLLogQuerySet",
]


class SQLLogQuerySet(models.QuerySet):
    pass


class RequestLogQuerySet(models.QuerySet):
    pass
