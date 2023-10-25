from typing import Self

from django.db import models

from applications.choices import ApplicationStatusChoice
from applications.querysets.helpers import applicant_alias_case, application_status_case, unallocated_schedule_count


class ApplicationQuerySet(models.QuerySet):
    def reached_allocation(self) -> Self:
        """How many applications in this application round reached allocation stage?"""
        return self.filter(cancelled_date__isnull=True, sent_date__isnull=False)

    def with_applicant_alias(self) -> Self:
        return self.alias(applicant=applicant_alias_case())

    def with_status(self) -> Self:
        return self.alias(
            unallocated_schedule_count=unallocated_schedule_count("application_events"),
        ).annotate(
            application_status=application_status_case(),
        )

    def has_status(self, status: ApplicationStatusChoice) -> Self:
        return self.with_status().filter(application_status=status.value)

    def has_status_in(self, statuses: list[str]) -> Self:
        return self.with_status().filter(application_status__in=statuses)
