from typing import Self

from django.db.models import Case, QuerySet, Value, When
from django.utils import timezone

from applications.choices import ApplicationRoundStatusChoice


class ApplicationRoundQuerySet(QuerySet):
    def active(self) -> Self:
        return self.filter(sent_date=None)

    def with_round_status(self) -> Self:
        now = timezone.localtime()

        return self.annotate(
            round_status=Case(
                When(
                    sent_date__isnull=False,
                    then=Value(ApplicationRoundStatusChoice.RESULTS_SENT),
                ),
                When(
                    handled_date__isnull=False,
                    then=Value(ApplicationRoundStatusChoice.HANDLED),
                ),
                When(
                    application_period_begin__gt=now,
                    then=Value(ApplicationRoundStatusChoice.UPCOMING),
                ),
                When(
                    application_period_end__gt=now,
                    then=Value(ApplicationRoundStatusChoice.OPEN),
                ),
                default=Value(ApplicationRoundStatusChoice.IN_ALLOCATION),
            )
        )
