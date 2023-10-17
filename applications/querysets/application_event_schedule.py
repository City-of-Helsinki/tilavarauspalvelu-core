from typing import Self

from django.db import models


class ApplicationEventScheduleQuerySet(models.QuerySet):
    def allocated(self) -> Self:
        return self.exclude(
            models.Q(allocated_begin__isnull=True)
            | models.Q(allocated_end__isnull=True)
            | models.Q(allocated_day__isnull=True)
            | models.Q(allocated_reservation_unit__isnull=True)
        )
