from django.db import models

__all__ = [
    "SQLLogManager",
    "SQLLogQuerySet",
]


class SQLLogQuerySet(models.QuerySet): ...


class SQLLogManager(models.Manager.from_queryset(SQLLogQuerySet)): ...
