from django.db import models

__all__ = [
    "RecurringReservationManager",
    "RecurringReservationQuerySet",
]


class RecurringReservationQuerySet(models.QuerySet): ...


class RecurringReservationManager(models.Manager.from_queryset(RecurringReservationQuerySet)): ...
