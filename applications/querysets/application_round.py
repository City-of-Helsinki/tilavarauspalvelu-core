from typing import Self

from django.db.models import QuerySet


class ApplicationRoundQuerySet(QuerySet):
    def active(self) -> Self:
        return self.filter(sent_date=None)
