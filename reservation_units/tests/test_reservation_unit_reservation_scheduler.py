import datetime
from unittest import mock

import pytest
from assertpy import assert_that
from django.conf import settings
from django.test.testcases import TestCase
from django.utils.timezone import get_default_timezone
from freezegun import freeze_time

from applications.models import ApplicationRoundStatus
from applications.tests.factories import ApplicationRoundFactory
from opening_hours.hours import TimeElement
from reservation_units.tests.factories import ReservationUnitFactory
from reservation_units.utils.reservation_unit_reservation_scheduler import (
    ReservationUnitReservationScheduler,
)
from reservations.models import STATE_CHOICES
from reservations.tests.factories import ReservationFactory
from spaces.tests.factories import SpaceFactory

DEFAULT_TIMEZONE = get_default_timezone()


@pytest.mark.django_db
@freeze_time("2022-01-01")
@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
class ReservationUnitSchedulerGetNextAvailableReservationTimeTestCase(TestCase):
    DATES = [
        datetime.datetime.strptime("2022-01-01", "%Y-%m-%d").date(),
        datetime.datetime.strptime("2022-01-02", "%Y-%m-%d").date(),
        datetime.datetime.strptime("2023-07-01", "%Y-%m-%d").date(),
    ]

    @classmethod
    def setUpTestData(cls) -> None:
        space = SpaceFactory()
        cls.reservation_unit = ReservationUnitFactory(spaces=[space])
        cls.app_round = ApplicationRoundFactory(
            reservation_units=[cls.reservation_unit],
            reservation_period_begin=datetime.date(2022, 8, 1),
            reservation_period_end=datetime.date(2023, 2, 28),
            application_period_begin=datetime.datetime(2022, 4, 1, 9, 0),
            application_period_end=datetime.datetime(2022, 4, 30, 16, 00),
        )
        cls.reservation = ReservationFactory(
            begin=datetime.datetime(2022, 4, 15, 12, 00, tzinfo=DEFAULT_TIMEZONE),
            end=datetime.datetime(2022, 4, 15, 14, 00, tzinfo=DEFAULT_TIMEZONE),
            reservation_unit=[cls.reservation_unit],
            state=STATE_CHOICES.CREATED,
        )

    @mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
    def setUp(self, mock) -> None:
        mock.return_value = self.get_mocked_opening_hours()
        self.scheduler = ReservationUnitReservationScheduler(
            self.reservation_unit, opening_hours_end=self.DATES[2]
        )
        self.app_round.set_status(ApplicationRoundStatus.APPROVED)

    def get_mocked_opening_hours(self):
        resource_id = f"{settings.HAUKI_ORIGIN_ID}:{self.reservation_unit.uuid}"
        return [
            {
                "timezone": DEFAULT_TIMEZONE,
                "resource_id": resource_id,
                "origin_id": str(self.reservation_unit.uuid),
                "date": self.DATES[0],
                "times": [
                    TimeElement(
                        start_time=datetime.time(hour=10),
                        end_time=datetime.time(hour=22),
                        end_time_on_next_day=False,
                    ),
                ],
            },
            {
                "timezone": DEFAULT_TIMEZONE,
                "resource_id": resource_id,
                "origin_id": str(self.reservation_unit.uuid),
                "date": self.DATES[1],
                "times": [
                    TimeElement(
                        start_time=datetime.time(hour=10),
                        end_time=datetime.time(hour=22),
                        end_time_on_next_day=False,
                    ),
                ],
            },
            {
                "timezone": DEFAULT_TIMEZONE,
                "resource_id": resource_id,
                "origin_id": str(self.reservation_unit.uuid),
                "date": self.DATES[2],
                "times": [
                    TimeElement(
                        start_time=datetime.time(hour=10),
                        end_time=datetime.time(hour=22),
                        end_time_on_next_day=False,
                    ),
                ],
            },
        ]

    def test_got_reservation_time(self, mock):
        begin, end = self.scheduler.get_next_available_reservation_time()

        assert_that(begin).is_not_none()
        assert_that(end).is_not_none()

        assert_that(begin).is_equal_to(
            datetime.datetime(
                2022,
                1,
                1,
                10,
                0,
            ).astimezone(DEFAULT_TIMEZONE)
        )

    def test_reservations_overlapping(self, mock):
        ReservationFactory(
            begin=datetime.datetime(2022, 1, 1, 10, 00, tzinfo=DEFAULT_TIMEZONE),
            end=datetime.datetime(2022, 1, 1, 22, 00, tzinfo=DEFAULT_TIMEZONE),
            reservation_unit=[self.reservation_unit],
            state=STATE_CHOICES.CREATED,
        )
        begin, end = self.scheduler.get_next_available_reservation_time()

        assert_that(begin).is_not_none()
        assert_that(end).is_not_none()

        assert_that(begin).is_equal_to(
            datetime.datetime(2022, 1, 2, 10, 0).astimezone(DEFAULT_TIMEZONE)
        )

    def test_no_opening_hours(self, mock):
        mock.return_value = []
        self.scheduler = ReservationUnitReservationScheduler(self.reservation_unit)

        begin, end = self.scheduler.get_next_available_reservation_time()
        assert_that(begin).is_none()
        assert_that(end).is_none()

    def test_application_round_is_open(self, mock):
        self.app_round.reservation_period_begin = datetime.date(2022, 1, 1)
        self.app_round.reservation_period_end = datetime.date(2022, 1, 1)
        self.app_round.set_status(ApplicationRoundStatus.IN_REVIEW)
        self.app_round.save()
        begin, end = self.scheduler.get_next_available_reservation_time()

        assert_that(begin).is_equal_to(
            datetime.datetime(2022, 1, 2, 10, 0).astimezone(DEFAULT_TIMEZONE)
        )

    def test_application_round_is_open_no_opening_times_after(self, mock):
        self.app_round.reservation_period_begin = datetime.date(2022, 1, 1)
        self.app_round.reservation_period_end = datetime.date(2022, 1, 2)
        self.app_round.set_status(ApplicationRoundStatus.IN_REVIEW)
        self.app_round.save()

        begin, end = self.scheduler.get_next_available_reservation_time()
        assert_that(begin).is_none()
        assert_that(end).is_none()

    def test_application_round_is_open_reservations_overlap_after(self, mock):
        self.app_round.reservation_period_begin = datetime.date(2022, 1, 1)
        self.app_round.reservation_period_end = datetime.date(2022, 1, 1)
        self.app_round.set_status(ApplicationRoundStatus.IN_REVIEW)
        self.app_round.save()

        ReservationFactory(
            begin=datetime.datetime(2022, 1, 2, 10, 00, tzinfo=DEFAULT_TIMEZONE),
            end=datetime.datetime(2022, 1, 2, 22, 00, tzinfo=DEFAULT_TIMEZONE),
            reservation_unit=[self.reservation_unit],
            state=STATE_CHOICES.CREATED,
        )

        begin, end = self.scheduler.get_next_available_reservation_time()
        assert_that(begin).is_none()
        assert_that(end).is_none()

    def test_get_reservation_unit_possible_start_times(self, mock):
        start_date = datetime.date(2022, 1, 1)
        interval = datetime.timedelta(minutes=90)
        possible_start_times = self.scheduler.get_reservation_unit_possible_start_times(
            start_date, interval
        )
        assert_that(possible_start_times).is_equal_to(
            {
                datetime.datetime(2022, 1, 1, 10, 0).astimezone(DEFAULT_TIMEZONE),
                datetime.datetime(2022, 1, 1, 11, 30).astimezone(DEFAULT_TIMEZONE),
                datetime.datetime(2022, 1, 1, 13, 00).astimezone(DEFAULT_TIMEZONE),
                datetime.datetime(2022, 1, 1, 14, 30).astimezone(DEFAULT_TIMEZONE),
                datetime.datetime(2022, 1, 1, 16, 00).astimezone(DEFAULT_TIMEZONE),
                datetime.datetime(2022, 1, 1, 17, 30).astimezone(DEFAULT_TIMEZONE),
                datetime.datetime(2022, 1, 1, 19, 00).astimezone(DEFAULT_TIMEZONE),
                datetime.datetime(2022, 1, 1, 20, 30).astimezone(DEFAULT_TIMEZONE),
            }
        )
