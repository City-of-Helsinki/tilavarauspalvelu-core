import datetime
from unittest import mock

from assertpy import assert_that
from django.conf import settings
from django.test.testcases import TestCase

from opening_hours.hours import TimeElement
from opening_hours.utils.opening_hours_client import OpeningHoursClient
from reservation_units.tests.factories import ReservationUnitFactory
from spaces.tests.factories import UnitFactory

DATES = [
    datetime.datetime.strptime("2021-01-01", "%Y-%m-%d").date(),
    datetime.datetime.strptime("2021-01-02", "%Y-%m-%d").date(),
]


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
class OpeningHoursClientTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.reservation_unit = ReservationUnitFactory()
        cls.unit = UnitFactory(tprek_id=1234)

    def get_mocked_opening_hours(self):
        resource_id = f"{settings.HAUKI_ORIGIN_ID}:{self.reservation_unit.uuid}"
        return [
            {
                "resource_id": resource_id,
                "origin_id": str(self.reservation_unit.uuid),
                "date": DATES[0],
                "times": [
                    TimeElement(
                        start_time=datetime.time(hour=10),
                        end_time=datetime.time(hour=22),
                        end_time_on_next_day=False,
                    ),
                ],
            },
            {
                "resource_id": resource_id,
                "origin_id": str(self.reservation_unit.uuid),
                "date": DATES[1],
                "times": [
                    TimeElement(
                        start_time=datetime.time(hour=10),
                        end_time=datetime.time(hour=22),
                        end_time_on_next_day=False,
                    ),
                ],
            },
        ]

    def test_client_inits_multiple_resources(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        resources = [str(self.reservation_unit.uuid)]
        client = OpeningHoursClient(resources, DATES[0], DATES[1])

        assert_that(client).is_not_none()

    def test_client_inits_single_resource(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        client = OpeningHoursClient(
            str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True
        )
        assert_that(client).is_not_none()

    def test_get_opening_hours_for_resource(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        client = OpeningHoursClient(
            str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True
        )
        times = client.get_opening_hours_for_resource(
            str(self.reservation_unit.uuid), DATES[0]
        )
        assert_that(len(times)).is_greater_than(0)

    def test_refresh_opening_hours(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        client = OpeningHoursClient(
            str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True
        )
        client.refresh_opening_hours()
        assert_that(mock.call_count).is_equal_to(2)

    def test_get_opening_hours_for_resources_when_resource_not_listed(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        client = OpeningHoursClient(
            str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True
        )
        times = client.get_opening_hours_for_resource("non-existent", DATES[0])
        assert_that(times).is_empty()

    def test_is_resource_open_is_true(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        client = OpeningHoursClient(
            str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True
        )
        begin = datetime.datetime(
            year=DATES[0].year,
            month=DATES[0].month,
            day=DATES[0].day,
            hour=10,
            minute=00,
        )
        end = datetime.datetime(
            year=DATES[0].year,
            month=DATES[0].month,
            day=DATES[0].day,
            hour=12,
            minute=00,
        )
        is_open = client.is_resource_open(str(self.reservation_unit.uuid), begin, end)
        assert_that(is_open).is_true()

    def test_is_resource_open_is_false(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        client = OpeningHoursClient(
            str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True
        )
        begin = datetime.datetime(
            year=DATES[0].year,
            month=DATES[0].month,
            day=DATES[0].day,
            hour=21,
            minute=00,
        )
        end = datetime.datetime(
            year=DATES[0].year,
            month=DATES[0].month,
            day=DATES[0].day,
            hour=23,
            minute=00,
        )
        is_open = client.is_resource_open(str(self.reservation_unit.uuid), begin, end)
        assert_that(is_open).is_false()

    def test_next_opening_times_returns_date_and_times(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        client = OpeningHoursClient(
            str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True
        )
        date, times = client.next_opening_times(
            str(self.reservation_unit.uuid), DATES[0]
        )

        assert_that(date).is_equal_to(DATES[0])
        assert_that(times).is_not_empty()

        datetime.datetime.strptime("2021-01-01", "%Y-%m-%d")
        from_date = datetime.date(2020, 12, 1)
        date, times = client.next_opening_times(
            str(self.reservation_unit.uuid), from_date
        )
        assert_that(date).is_equal_to(DATES[0])
        assert_that(times).is_not_empty()

    def test_next_opening_times_returns_empty_time(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        from_date = datetime.date(2022, 1, 1)
        client = OpeningHoursClient(
            str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True
        )
        date, times = client.next_opening_times(
            str(self.reservation_unit.uuid), from_date
        )

        assert_that(date).is_none()
        assert_that(times).is_none()

    def test_default_origin_id_is_used(self, mock):
        OpeningHoursClient(
            str(self.reservation_unit.uuid),
            DATES[0],
            DATES[0],
            single=True,
        )
        origin_id = mock.call_args.args[3]
        assert_that(origin_id).is_same_as(settings.HAUKI_ORIGIN_ID)

    def test_origin_id_is_overridden(self, mock):
        OpeningHoursClient(
            str(self.unit.tprek_id),
            DATES[0],
            DATES[0],
            single=True,
            hauki_origin_id=self.unit.hauki_resource_origin_id,
        )
        origin_id = mock.call_args.args[3]
        assert_that(origin_id).is_same_as(self.unit.hauki_resource_origin_id)
