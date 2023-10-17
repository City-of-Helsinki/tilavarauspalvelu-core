from collections.abc import Sequence
from datetime import timedelta
from typing import Self, TypedDict

from django.db import models
from django.db.models.functions import Concat, Now

from applications.choices import ApplicationEventStatusChoice, ApplicationStatusChoice
from reservations.choices import ReservationStateChoice


class AggregateEventData(TypedDict):
    event_duration: timedelta
    min_duration: timedelta


class ApplicationEventQuerySet(models.QuerySet):
    def with_applicant_alias(self) -> Self:
        return self.alias(
            applicant=models.Case(
                models.When(
                    application__organisation__isnull=False,
                    then=models.F("application__organisation__name"),
                ),
                models.When(
                    application__contact_person__isnull=False,
                    then=Concat(
                        "application__contact_person__first_name",
                        models.Value(" "),
                        "application__contact_person__last_name",
                    ),
                ),
                models.When(
                    application__user__isnull=False,
                    then=Concat(
                        "application__user__first_name",
                        models.Value(" "),
                        "application__user__last_name",
                    ),
                ),
                default=models.Value(""),
                output_field=models.CharField(),
            )
        )

    def get_event_duration_info(self) -> Sequence[AggregateEventData]:
        return (
            self.alias(
                event_duration_base=(models.F("begin") - models.F("end")) / 7 * models.F("events_per_week"),
            )
            .annotate(
                event_duration=models.Case(
                    models.When(models.Q(biweekly=True), then=models.F("event_duration_base") / 2),
                    default=models.F("event_duration_base"),
                    output_field=models.DurationField(),
                ),
            )
            .values("event_duration", "min_duration")
        )

    def unallocated(self) -> Self:
        return self.filter(
            models.Q(application_event_schedules__isnull=True)
            | (
                models.Q(application_event_schedules__declined=False)
                & (
                    models.Q(application_event_schedules__allocated_day__isnull=True)
                    | models.Q(application_event_schedules__allocated_begin__isnull=True)
                    | models.Q(application_event_schedules__allocated_end__isnull=True)
                    | models.Q(application_event_schedules__allocated_reservation_unit__isnull=True)
                )
            )
        )

    def with_event_status(self) -> Self:
        return self.alias(
            schedule_count=models.Count("application_event_schedules"),
            non_declined_count=models.Count(
                "application_event_schedules",
                filter=models.Q(application_event_schedules__declined=False),
            ),
            accepted_count=models.Count(
                "application_event_schedules",
                filter=(
                    models.Q(application_event_schedules__declined=False)
                    & models.Q(application_event_schedules__allocated_day__isnull=False)
                    & models.Q(application_event_schedules__allocated_begin__isnull=False)
                    & models.Q(application_event_schedules__allocated_end__isnull=False)
                    & models.Q(application_event_schedules__allocated_reservation_unit__isnull=False)
                ),
            ),
            recurring_count=models.Count("recurring_reservations"),
            recurring_denied_count=models.Count(
                "recurring_reservations",
                filter=models.Q(recurring_reservations__reservations__state=ReservationStateChoice.DENIED),
            ),
        ).annotate(
            event_status=models.Case(
                models.When(
                    ~models.Q(schedule_count=0) & models.Q(non_declined_count=0),
                    then=models.Value(
                        ApplicationEventStatusChoice.DECLINED.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    models.Q(schedule_count=0) | models.Q(accepted_count=0),
                    then=models.Value(
                        ApplicationEventStatusChoice.UNALLOCATED.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    models.Q(recurring_count=0),
                    then=models.Value(
                        ApplicationEventStatusChoice.APPROVED.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    ~models.Q(recurring_denied_count=0),
                    then=models.Value(
                        ApplicationEventStatusChoice.FAILED.value,
                        output_field=models.CharField(),
                    ),
                ),
                default=models.Value(
                    ApplicationEventStatusChoice.RESERVED.value,
                    output_field=models.CharField(),
                ),
                output_field=models.CharField(),
            ),
        )

    def has_status(self, status: ApplicationEventStatusChoice) -> Self:
        return self.with_event_status().filter(event_status=status.value)

    def with_application_status(self) -> Self:
        # Duplicate code in `applications.querysets.application.ApplicationQuerySet.with_status`
        return self.alias(
            unallocated_count=models.Count(
                "application_event_schedules",
                filter=(
                    models.Q(application_event_schedules__isnull=True)
                    | models.Q(application_event_schedules__allocated_begin__isnull=True)
                    | models.Q(application_event_schedules__allocated_end__isnull=True)
                    | models.Q(application_event_schedules__allocated_day__isnull=True)
                    | models.Q(application_event_schedules__allocated_reservation_unit__isnull=True)
                ),
            )
        ).annotate(
            application_status=models.Case(
                models.When(
                    models.Q(application__cancelled_date__isnull=False),
                    then=models.Value(
                        ApplicationStatusChoice.CANCELLED.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    (
                        models.Q(application__sent_date__isnull=True)
                        & models.Q(application__application_round__sent_date__isnull=True)
                        & models.Q(application__application_round__handled_date__isnull=True)
                        & models.Q(application__application_round__application_period_end__gt=Now())
                    ),
                    then=models.Value(
                        ApplicationStatusChoice.DRAFT.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    models.Q(application__sent_date__isnull=True),
                    then=models.Value(
                        ApplicationStatusChoice.EXPIRED.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    models.Q(application__application_round__sent_date__isnull=False),
                    then=models.Value(
                        ApplicationStatusChoice.RESULTS_SENT.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    models.Q(application__application_round__handled_date__isnull=False),
                    then=models.Value(
                        ApplicationStatusChoice.HANDLED.value,
                        output_field=models.CharField(),
                    ),
                ),
                models.When(
                    models.Q(application__application_round__application_period_end__gt=Now()),
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

    def has_application_status(self, status: ApplicationStatusChoice) -> Self:
        return self.with_application_status().filter(application_status=status.value)
