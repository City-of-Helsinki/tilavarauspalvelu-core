import datetime

import pytest
from assertpy import assert_that
from django.utils.timezone import get_default_timezone

from applications.models import (
    ApplicationAggregateData,
    ApplicationEvent,
    ApplicationStatus,
)
from reservations.models import STATE_CHOICES
from reservations.tests.factories import RecurringReservationFactory, ReservationFactory

DEFAULT_TIMEZONE = get_default_timezone()


@pytest.mark.django_db
def test_application_aggregate_data_creates_when_status_in_review(
    recurring_application_event,
):
    assert ApplicationAggregateData.objects.exists() is False
    recurring_application_event.application.set_status(ApplicationStatus.IN_REVIEW)
    assert ApplicationAggregateData.objects.count() == 4


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
    assert ApplicationAggregateData.objects.count() == 4
    min_dur_tot = ApplicationAggregateData.objects.get(name="applied_min_duration_total")

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
    assert ApplicationAggregateData.objects.count() == 4
    res_tot = ApplicationAggregateData.objects.get(name="applied_reservations_total")

    # First, every other week two times for twelve whole week => 6 weeks
    # 6 weeks * two times per week = 12 reservations
    # Second, every week two times for eight weeks
    # 8 weeks * two times per week = 16 reservations
    assert res_tot.value == (12) + (16)


@pytest.mark.django_db
def test_aggregate_data_creates_data_per_application(
    recurring_application_event, application_in_second_application_round
):
    ApplicationEvent.objects.create(
        application=application_in_second_application_round,
        num_persons=5,
        min_duration=datetime.timedelta(hours=1),
        max_duration=datetime.timedelta(hours=2),
        name="Football",
        events_per_week=2,
        begin=datetime.date(year=2020, month=1, day=1),
        end=datetime.date(year=2020, month=2, day=28),
        biweekly=False,
    )

    recurring_application_event.application.set_status(ApplicationStatus.IN_REVIEW)
    application_in_second_application_round.set_status(ApplicationStatus.IN_REVIEW)

    assert recurring_application_event.application is not application_in_second_application_round

    assert ApplicationAggregateData.objects.filter(application=recurring_application_event.application).count() == 4

    assert ApplicationAggregateData.objects.filter(application=application_in_second_application_round).count() == 4


@pytest.mark.django_db
def test_aggregate_data_creates_data_per_application_reservations_total(
    recurring_application_event, application_in_second_application_round
):
    ApplicationEvent.objects.create(
        application=application_in_second_application_round,
        num_persons=5,
        min_duration=datetime.timedelta(hours=1),
        max_duration=datetime.timedelta(hours=2),
        name="Football",
        events_per_week=1,
        begin=datetime.date(year=2020, month=1, day=1),
        end=datetime.date(year=2020, month=2, day=28),
        biweekly=False,
    )

    recurring_application_event.application.set_status(ApplicationStatus.IN_REVIEW)
    application_in_second_application_round.set_status(ApplicationStatus.IN_REVIEW)

    aggregate_datas_one = ApplicationAggregateData.objects.filter(application=recurring_application_event.application)

    aggregate_datas_two = ApplicationAggregateData.objects.filter(application=application_in_second_application_round)

    one_res = aggregate_datas_one.get(name="applied_reservations_total")
    assert one_res.value == 16

    two_res = aggregate_datas_two.get(name="applied_reservations_total")
    assert two_res.value == 8


@pytest.mark.django_db
def test_aggregate_data_creates_data_per_application_min_duration_total(
    recurring_application_event, application_in_second_application_round
):
    ApplicationEvent.objects.create(
        application=application_in_second_application_round,
        num_persons=5,
        min_duration=datetime.timedelta(hours=1),
        max_duration=datetime.timedelta(hours=2),
        name="Football",
        events_per_week=1,
        begin=datetime.date(year=2020, month=1, day=1),
        end=datetime.date(year=2020, month=2, day=28),
        biweekly=False,
    )

    recurring_application_event.application.set_status(ApplicationStatus.IN_REVIEW)
    application_in_second_application_round.set_status(ApplicationStatus.IN_REVIEW)

    aggregate_datas_one = ApplicationAggregateData.objects.filter(application=recurring_application_event.application)

    aggregate_datas_two = ApplicationAggregateData.objects.filter(application=application_in_second_application_round)

    one_res = aggregate_datas_one.get(name="applied_min_duration_total")
    assert one_res.value == 16 * 3600

    two_res = aggregate_datas_two.get(name="applied_min_duration_total")
    assert two_res.value == 8 * 3600


@pytest.mark.django_db
def test_aggregate_data_creates_data_per_application_reservations_duration_total(
    recurring_application_event, application_in_second_application_round
):
    recurring = RecurringReservationFactory(
        application=recurring_application_event.application,
        application_event=recurring_application_event,
    )
    ReservationFactory(
        state=STATE_CHOICES.CREATED,
        begin=datetime.datetime(2021, 5, 1, 12, 0, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2021, 5, 1, 14, 0, tzinfo=DEFAULT_TIMEZONE),
        recurring_reservation=recurring,
    )

    recurring = RecurringReservationFactory(
        application=application_in_second_application_round,
        # this shouldn't matter since we're getting the data per application.
        application_event=recurring_application_event,
    )
    ReservationFactory(
        state=STATE_CHOICES.CREATED,
        begin=datetime.datetime(2021, 6, 1, 15, 0, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2021, 6, 1, 18, 0, tzinfo=DEFAULT_TIMEZONE),
        recurring_reservation=recurring,
    )

    recurring_application_event.application.create_aggregate_data()
    application_in_second_application_round.create_aggregate_data()

    aggregate_datas_one = ApplicationAggregateData.objects.filter(application=recurring_application_event.application)

    aggregate_datas_two = ApplicationAggregateData.objects.filter(application=application_in_second_application_round)

    one_res = aggregate_datas_one.get(name="reservations_duration_total")
    assert_that(one_res.value).is_equal_to(3600 * 2)

    two_res = aggregate_datas_two.get(name="reservations_duration_total")
    assert_that(two_res.value).is_equal_to(3600 * 3)


@pytest.mark.django_db
def test_aggregate_data_creates_data_per_application_created_reservations_total(
    recurring_application_event, application_in_second_application_round
):
    recurring = RecurringReservationFactory(
        application=recurring_application_event.application,
        application_event=recurring_application_event,
    )
    ReservationFactory(
        state=STATE_CHOICES.CREATED,
        begin=datetime.datetime(2021, 5, 1, 12, 0, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2021, 5, 1, 14, 0, tzinfo=DEFAULT_TIMEZONE),
        recurring_reservation=recurring,
    )

    recurring = RecurringReservationFactory(
        application=application_in_second_application_round,
        application_event=recurring_application_event,
    )
    ReservationFactory(
        state=STATE_CHOICES.CREATED,
        begin=datetime.datetime(2021, 6, 1, 15, 0, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2021, 6, 1, 18, 0, tzinfo=DEFAULT_TIMEZONE),
        recurring_reservation=recurring,
    )

    recurring_application_event.application.create_aggregate_data()
    application_in_second_application_round.create_aggregate_data()

    aggregate_datas_one = ApplicationAggregateData.objects.filter(application=recurring_application_event.application)

    aggregate_datas_two = ApplicationAggregateData.objects.filter(application=application_in_second_application_round)

    one_res = aggregate_datas_one.get(name="created_reservations_total")
    assert_that(one_res.value).is_equal_to(1)

    two_res = aggregate_datas_two.get(name="created_reservations_total")
    assert_that(two_res.value).is_equal_to(1)
