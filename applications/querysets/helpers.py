from django.db import models
from django.db.models import functions

from applications.choices import ApplicationEventStatusChoice, ApplicationStatusChoice
from reservations.choices import ReservationStateChoice


def unallocated_schedule_filter(prefix: str = "") -> models.Q:
    if prefix and not prefix.endswith("__"):
        prefix = f"{prefix}__"

    return (
        # Include events that:
        # 1) Have no schedules
        # 2) Have no declined schedules AND are not allocated
        models.Q(**{f"{prefix}application_event_schedules__isnull": True})
        | (
            models.Q(**{f"{prefix}application_event_schedules__declined": False})
            & (
                models.Q(**{f"{prefix}application_event_schedules__allocated_day__isnull": True})
                | models.Q(**{f"{prefix}application_event_schedules__allocated_begin__isnull": True})
                | models.Q(**{f"{prefix}application_event_schedules__allocated_end__isnull": True})
                | models.Q(**{f"{prefix}application_event_schedules__allocated_reservation_unit__isnull": True})
            )
        )
    )


def unallocated_schedule_count(prefix: str = "") -> models.Count:
    if prefix and not prefix.endswith("__"):
        prefix = f"{prefix}__"

    return models.Count(
        f"{prefix}application_event_schedules",
        filter=unallocated_schedule_filter(prefix),
    )


def accepted_event_filter(prefix: str = "") -> models.Q:
    if prefix and not prefix.endswith("__"):
        prefix = f"{prefix}__"

    return (
        # Don't include declined schedules
        # AND none where allocation data is filled
        models.Q(**{f"{prefix}application_event_schedules__declined": False})
        & models.Q(**{f"{prefix}application_event_schedules__allocated_day__isnull": False})
        & models.Q(**{f"{prefix}application_event_schedules__allocated_begin__isnull": False})
        & models.Q(**{f"{prefix}application_event_schedules__allocated_end__isnull": False})
        & models.Q(**{f"{prefix}application_event_schedules__allocated_reservation_unit__isnull": False})
    )


def accepted_event_count(prefix: str = "") -> models.Count:
    if prefix and not prefix.endswith("__"):
        prefix = f"{prefix}__"

    return models.Count(
        f"{prefix}application_event_schedules",
        filter=accepted_event_filter(prefix),
    )


def non_declined_event_count(prefix: str = "") -> models.Count:
    # Count of schedules either allocated or declined
    if prefix and not prefix.endswith("__"):
        prefix = f"{prefix}__"

    return models.Count(
        f"{prefix}application_event_schedules",
        # Don't count any declined schedules
        filter=models.Q(**{f"{prefix}application_event_schedules__declined": False}),
    )


def applicant_alias_case(prefix: str = "") -> models.Case:
    if prefix and not prefix.endswith("__"):
        prefix = f"{prefix}__"

    return models.Case(
        models.When(
            models.Q(**{f"{prefix}organisation__isnull": False}),
            then=models.F(f"{prefix}organisation__name"),
        ),
        models.When(
            models.Q(**{f"{prefix}contact_person__isnull": False}),
            then=functions.Concat(
                f"{prefix}contact_person__first_name",
                models.Value(" "),
                f"{prefix}contact_person__last_name",
            ),
        ),
        models.When(
            models.Q(**{f"{prefix}user__isnull": False}),
            then=functions.Concat(
                f"{prefix}user__first_name",
                models.Value(" "),
                f"{prefix}user__last_name",
            ),
        ),
        default=models.Value(""),
        output_field=models.CharField(),
    )


def application_status_case(prefix: str = "") -> models.Case:
    if prefix and not prefix.endswith("__"):
        prefix = f"{prefix}__"

    return models.Case(
        models.When(
            # If there is a cancelled date
            models.Q(**{f"{prefix}cancelled_date__isnull": False}),
            then=models.Value(
                ApplicationStatusChoice.CANCELLED.value,
                output_field=models.CharField(),
            ),
        ),
        models.When(
            # If there is no sent date in the application
            # AND the application round has also not been marked as sent
            # AND the application round has also not been marked as handled
            # AND the application round application period has not ended
            (
                models.Q(**{f"{prefix}sent_date__isnull": True})
                & models.Q(**{f"{prefix}application_round__sent_date__isnull": True})
                & models.Q(**{f"{prefix}application_round__handled_date__isnull": True})
                & models.Q(**{f"{prefix}application_round__application_period_end__gt": functions.Now()})
            ),
            then=models.Value(
                ApplicationStatusChoice.DRAFT.value,
                output_field=models.CharField(),
            ),
        ),
        models.When(
            # If there is no sent date in the application
            # (and the application round has moved on according to the previous cases)
            models.Q(**{f"{prefix}sent_date__isnull": True}),
            then=models.Value(
                ApplicationStatusChoice.EXPIRED.value,
                output_field=models.CharField(),
            ),
        ),
        models.When(
            # If the application round has been marked as sent
            models.Q(**{f"{prefix}application_round__sent_date__isnull": False}),
            then=models.Value(
                ApplicationStatusChoice.RESULTS_SENT.value,
                output_field=models.CharField(),
            ),
        ),
        models.When(
            # If the application round has been marked as handled
            models.Q(**{f"{prefix}application_round__handled_date__isnull": False}),
            then=models.Value(
                ApplicationStatusChoice.HANDLED.value,
                output_field=models.CharField(),
            ),
        ),
        models.When(
            # If the application round application period has ended
            models.Q(**{f"{prefix}application_round__application_period_end__gt": functions.Now()}),
            then=models.Value(
                ApplicationStatusChoice.RECEIVED.value,
                output_field=models.CharField(),
            ),
        ),
        models.When(
            # If at least
            ~models.Q(unallocated_schedule_count=0),
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
    )


def application_event_status_required_aliases(prefix: str = "") -> dict[str, models.Count]:
    if prefix and not prefix.endswith("__"):
        prefix = f"{prefix}__"

    return {
        "schedule_count": models.Count(f"{prefix}application_event_schedules"),
        "non_declined_count": non_declined_event_count(prefix),
        "accepted_count": accepted_event_count(prefix),
        "recurring_count": models.Count(f"{prefix}application_event_schedules__recurring_reservations"),
        "recurring_denied_count": models.Count(
            f"{prefix}application_event_schedules__recurring_reservations",
            filter=models.Q(
                **{
                    f"{prefix}application_event_schedules__recurring_reservations__reservations__state": (
                        ReservationStateChoice.DENIED
                    )
                }
            ),
        ),
    }


def application_event_status_case() -> models.Case:
    return models.Case(
        models.When(
            # If there are schedules
            # AND all of them are declined
            ~models.Q(schedule_count=0) & models.Q(non_declined_count=0),
            then=models.Value(
                ApplicationEventStatusChoice.DECLINED.value,
                output_field=models.CharField(),
            ),
        ),
        models.When(
            # If there are no schedules
            # OR none of them are accepted
            models.Q(schedule_count=0) | models.Q(accepted_count=0),
            then=models.Value(
                ApplicationEventStatusChoice.UNALLOCATED.value,
                output_field=models.CharField(),
            ),
        ),
        models.When(
            # If there are no recurring reservations
            models.Q(recurring_count=0),
            then=models.Value(
                ApplicationEventStatusChoice.APPROVED.value,
                output_field=models.CharField(),
            ),
        ),
        models.When(
            # If there is at least one denied recurring reservation
            ~models.Q(recurring_denied_count=0),
            then=models.Value(
                ApplicationEventStatusChoice.FAILED.value,
                output_field=models.CharField(),
            ),
        ),
        default=models.Value(
            # Otherwise all reservation are successful
            ApplicationEventStatusChoice.RESERVED.value,
            output_field=models.CharField(),
        ),
        output_field=models.CharField(),
    )
