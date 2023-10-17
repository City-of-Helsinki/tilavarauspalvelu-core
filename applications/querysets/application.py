from typing import Self

from django.db import models
from django.db.models.functions import Concat, Now

from applications.choices import ApplicationStatusChoice


class ApplicationQuerySet(models.QuerySet):
    def reached_allocation(self) -> Self:
        """How many applications in this application round reached allocation stage?"""
        return self.filter(cancelled_date__isnull=True, sent_date__isnull=False)

    def with_applicant_alias(self) -> Self:
        return self.alias(
            applicant=models.Case(
                models.When(
                    organisation__isnull=False,
                    then=models.F("organisation__name"),
                ),
                models.When(
                    contact_person__isnull=False,
                    then=Concat(
                        "contact_person__first_name",
                        models.Value(" "),
                        "contact_person__last_name",
                    ),
                ),
                models.When(
                    user__isnull=False,
                    then=Concat(
                        "user__first_name",
                        models.Value(" "),
                        "user__last_name",
                    ),
                ),
                default=models.Value(""),
                output_field=models.CharField(),
            )
        )

    def with_status(self) -> Self:
        # Duplicate code in `applications.querysets.application_event.ApplicationEventQuerySet.with_application_status`
        return self.alias(
            unallocated_count=models.Count(
                "application_events__application_event_schedules",
                filter=(
                    models.Q(application_events__isnull=True)
                    | models.Q(application_events__application_event_schedules__isnull=True)
                    | models.Q(application_events__application_event_schedules__allocated_begin__isnull=True)
                    | models.Q(application_events__application_event_schedules__allocated_end__isnull=True)
                    | models.Q(application_events__application_event_schedules__allocated_day__isnull=True)
                    | models.Q(application_events__application_event_schedules__allocated_reservation_unit__isnull=True)
                ),
            )
        ).annotate(
            application_status=models.Case(
                models.When(
                    models.Q(cancelled_date__isnull=False),
                    then=models.Value(
                        ApplicationStatusChoice.CANCELLED.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    (
                        models.Q(sent_date__isnull=True)
                        & models.Q(application_round__sent_date__isnull=True)
                        & models.Q(application_round__handled_date__isnull=True)
                        & models.Q(application_round__application_period_end__gt=Now())
                    ),
                    then=models.Value(
                        ApplicationStatusChoice.DRAFT.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    models.Q(sent_date__isnull=True),
                    then=models.Value(
                        ApplicationStatusChoice.EXPIRED.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    models.Q(application_round__sent_date__isnull=False),
                    then=models.Value(
                        ApplicationStatusChoice.RESULTS_SENT.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    models.Q(application_round__handled_date__isnull=False),
                    then=models.Value(
                        ApplicationStatusChoice.HANDLED.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    models.Q(application_round__application_period_end__gt=Now()),
                    then=models.Value(
                        ApplicationStatusChoice.RECEIVED.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    ~models.Q(unallocated_count=0),
                    then=models.Value(
                        ApplicationStatusChoice.IN_ALLOCATION.value,
                        output_field=models.CharField(),
                    ),
                ),
                default=models.Value(
                    ApplicationStatusChoice.HANDLED.value,
                    output_field=models.CharField(),
                ),
                output_field=models.CharField(),
            ),
        )

    def has_status(self, status: ApplicationStatusChoice) -> Self:
        return self.with_status().filter(application_status=status.value)

    def has_status_in(self, statuses: list[str]) -> Self:
        return self.with_status().filter(application_status__in=statuses)
