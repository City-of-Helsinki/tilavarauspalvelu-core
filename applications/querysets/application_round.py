from typing import Self

from django.db import models


class ApplicationRoundQuerySet(models.QuerySet):
    def active(self) -> Self:
        return self.filter(sent_date=None)
