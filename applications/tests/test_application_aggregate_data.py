import datetime

import pytest

from applications.models import (
    ApplicationAggregateData,
    ApplicationEvent,
    ApplicationStatus,
)


@pytest.mark.django_db
def test_application_aggregate_data_creates_when_status_in_review(
    recurring_application_event,
):
    assert ApplicationAggregateData.objects.exists() is False
    recurring_application_event.application.set_status(ApplicationStatus.IN_REVIEW)
    assert ApplicationAggregateData.objects.count() == 2


@pytest.mark.django_db
def test_application_aggregate_data_does_not_create_when_status_not_in_review(
    recurring_application_event,
):
    recurring_application_event.application.set_status(ApplicationStatus.DRAFT)
    assert ApplicationAggregateData.objects.exists() is False


@pytest.mark.django_db
def test_application_aggregate_data_contains_min_duration_total(
    recurring_application_event,
):
    ApplicationEvent.objects.create(
        application=recurring_application_event.application,
        num_persons=10,
        min_duration=datetime.timedelta(hours=1),
        max_duration=datetime.timedelta(hours=2),
        name="Soccer",
        events_per_week=2,
        begin=datetime.date(year=2020, month=1, day=1),
        end=datetime.date(year=2020, month=3, day=31),
        biweekly=True,
    )

    recurring_application_event.application.set_status(ApplicationStatus.IN_REVIEW)
    assert ApplicationAggregateData.objects.count() == 2
    min_dur_tot = ApplicationAggregateData.objects.get(name="min_duration_total")

    # Two times per week every second week for 89 days => 12 whole weeks
    # 12 whole weeks every other week => 1 / week => 1 * 12 weeks => 12h
    # Two times per week every week for 58 => 8 whole weeks.
    # Two times per every week for eight whole weeks => 2 * 8 => 16h
    assert min_dur_tot.value == (12 * 3600) + (16 * 3600)


@pytest.mark.django_db
def test_application_aggregate_data_contains_reservations_total(
    recurring_application_event,
):
    ApplicationEvent.objects.create(
        application=recurring_application_event.application,
        num_persons=10,
        min_duration=datetime.timedelta(hours=1),
        max_duration=datetime.timedelta(hours=2),
        name="Soccer",
        events_per_week=2,
        begin=datetime.date(year=2020, month=1, day=1),
        end=datetime.date(year=2020, month=3, day=31),
        biweekly=True,
    )

    recurring_application_event.application.set_status(ApplicationStatus.IN_REVIEW)
    assert ApplicationAggregateData.objects.count() == 2
    res_tot = ApplicationAggregateData.objects.get(name="reservations_total")

    # First, every other week two times for twelve whole week => 6 weeks
    # 6 weeks * two times per week = 12 reservations
    # Second, every week two times for eight weeks
    # 8 weeks * two times per week = 16 reservations
    assert res_tot.value == (12) + (16)
