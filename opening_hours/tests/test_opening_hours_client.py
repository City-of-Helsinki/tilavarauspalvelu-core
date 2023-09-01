import datetime
from unittest import mock

from assertpy import assert_that
from django.conf import settings
from django.test.testcases import TestCase
from django.utils.timezone import get_default_timezone

from opening_hours.enums import State
from opening_hours.hours import TimeElement
from opening_hours.utils.opening_hours_client import OpeningHoursClient
from tests.factories import ReservationUnitFactory, UnitFactory

DATES = [
    datetime.datetime.strptime("2021-01-01", "%Y-%m-%d").date(),
    datetime.datetime.strptime("2021-01-02", "%Y-%m-%d").date(),
]

DEFAULT_TIMEZONE = get_default_timezone()


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
                "timezone": DEFAULT_TIMEZONE,
                "resource_id": resource_id,
                "origin_id": str(self.reservation_unit.uuid),
                "date": DATES[0],
                "times": [
                    TimeElement(
                        start_time=datetime.time(hour=10),
                        end_time=datetime.time(hour=22),
                        end_time_on_next_day=False,
                        resource_state=State.OPEN_AND_RESERVABLE.value,
                    ),
                ],
            },
            {
                "timezone": DEFAULT_TIMEZONE,
                "resource_id": resource_id,
                "origin_id": str(self.reservation_unit.uuid),
                "date": DATES[1],
                "times": [
                    TimeElement(
                        start_time=datetime.time(hour=10),
                        end_time=datetime.time(hour=22),
                        end_time_on_next_day=False,
                        resource_state=State.OPEN_AND_RESERVABLE.value,
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
        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)
        assert_that(client).is_not_none()

    def test_get_opening_hours_for_resource(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)
        times = client.get_opening_hours_for_resource(str(self.reservation_unit.uuid), DATES[0])
        assert_that(len(times)).is_greater_than(0)

    def test_opening_hours_start_end_null_works(self, mock):
        resource_id = f"{settings.HAUKI_ORIGIN_ID}:{self.reservation_unit.uuid}"
        data = [
            {
                "timezone": DEFAULT_TIMEZONE,
                "resource_id": resource_id,
                "origin_id": str(self.reservation_unit.uuid),
                "date": DATES[0],
                "times": [
                    TimeElement(
                        start_time=None,
                        end_time=None,
                        end_time_on_next_day=False,
                        resource_state=State.CLOSED.value,
                    ),
                ],
            },
            {
                "timezone": DEFAULT_TIMEZONE,
                "resource_id": resource_id,
                "origin_id": str(self.reservation_unit.uuid),
                "date": DATES[1],
                "times": [
                    TimeElement(
                        start_time=None,
                        end_time=None,
                        end_time_on_next_day=False,
                        resource_state=State.CLOSED.value,
                    ),
                ],
            },
        ]
        mock.return_value = data
        resources = [str(self.reservation_unit.uuid)]
        client = OpeningHoursClient(resources, DATES[0], DATES[1])

        assert_that(client).is_not_none()
        times = client.get_opening_hours_for_resource(str(self.reservation_unit.uuid), DATES[0])
        assert_that(times).is_not_empty()

    def test_refresh_opening_hours(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)
        client.refresh_opening_hours()
        assert_that(mock.call_count).is_equal_to(2)

    def test_get_opening_hours_for_resources_when_resource_not_listed(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)
        times = client.get_opening_hours_for_resource("non-existent", DATES[0])
        assert_that(times).is_empty()

    def test_is_resource_open_is_true(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)
        begin = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T10:00")
        end = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T12:00")
        is_open = client.is_resource_reservable(str(self.reservation_unit.uuid), begin, end)
        assert_that(is_open).is_true()

    def test_is_resource_open_is_false(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)
        begin = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T21:00")
        end = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T23:00")
        is_open = client.is_resource_reservable(str(self.reservation_unit.uuid), begin, end)
        assert_that(is_open).is_false()

    def test_is_resource_open_respects_timezone_is_true(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)
        begin = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T21:00+04:00")
        end = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T23:00+04:00")

        is_open = client.is_resource_reservable(str(self.reservation_unit.uuid), begin, end)
        assert_that(is_open).is_true()

    def test_is_resource_open_is_true_when_start_end_null(self, mock):
        dates = self.get_mocked_opening_hours()
        dates[0]["times"] = [
            TimeElement(
                start_time=None,
                end_time=None,
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            )
        ]
        dates[1]["times"] = [
            TimeElement(
                start_time=None,
                end_time=None,
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            )
        ]

        mock.return_value = dates

        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)
        begin = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T10:00")
        end = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T12:00")
        is_open = client.is_resource_reservable(str(self.reservation_unit.uuid), begin, end)
        assert_that(is_open).is_true()

    def test_is_resource_open_is_false_when_no_times_in_reservable_states(self, mock):
        dates = self.get_mocked_opening_hours()
        dates[0]["times"] = [
            TimeElement(
                start_time=None,
                end_time=None,
                end_time_on_next_day=False,
                resource_state=State.CLOSED.value,
            )
        ]
        dates[1]["times"] = [
            TimeElement(
                start_time=None,
                end_time=None,
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            )
        ]

        mock.return_value = dates

        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)
        begin = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T10:00")
        end = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T12:00")
        is_open = client.is_resource_reservable(str(self.reservation_unit.uuid), begin, end)
        assert_that(is_open).is_false()

    def test_is_resource_open_is_true_when_end_time_on_next_day(self, mock):
        dates = self.get_mocked_opening_hours()
        dates[0]["times"] = [
            TimeElement(
                start_time=datetime.time(hour=10),
                end_time=datetime.time(hour=6),
                end_time_on_next_day=True,
                resource_state=State.WITH_RESERVATION.value,
            )
        ]
        mock.return_value = dates

        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)
        begin = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T10:00")
        end = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T12:00")
        is_open = client.is_resource_reservable(str(self.reservation_unit.uuid), begin, end)
        assert_that(is_open).is_true()

    def test_is_resource_open_is_true_when_multiple_times_in_one_date_first_match(self, mock):
        dates = self.get_mocked_opening_hours()
        dates[0]["times"] = [
            TimeElement(
                start_time=datetime.time(hour=10),
                end_time=datetime.time(hour=12),
                end_time_on_next_day=False,
                resource_state=State.WITH_RESERVATION.value,
            ),
            TimeElement(
                start_time=datetime.time(hour=15),
                end_time=datetime.time(hour=18),
                end_time_on_next_day=False,
                resource_state=State.WITH_RESERVATION.value,
            ),
        ]
        mock.return_value = dates

        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)
        begin = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T10:00")
        end = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T12:00")
        is_open = client.is_resource_reservable(str(self.reservation_unit.uuid), begin, end)
        assert_that(is_open).is_true()

    def test_is_resource_open_is_true_when_multiple_times_in_one_date_second_match(self, mock):
        dates = self.get_mocked_opening_hours()
        dates[0]["times"] = [
            TimeElement(
                start_time=datetime.time(hour=10),
                end_time=datetime.time(hour=12),
                end_time_on_next_day=False,
                resource_state=State.WITH_RESERVATION.value,
            ),
            TimeElement(
                start_time=datetime.time(hour=15),
                end_time=datetime.time(hour=18),
                end_time_on_next_day=False,
                resource_state=State.WITH_RESERVATION.value,
            ),
        ]
        mock.return_value = dates
        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)

        begin = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T15:00")
        end = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T16:00")
        is_open = client.is_resource_reservable(str(self.reservation_unit.uuid), begin, end)
        assert_that(is_open).is_true()

    def test_is_resource_open_is_false_when_multiple_times_in_one_date_no_match(self, mock):
        dates = self.get_mocked_opening_hours()
        dates[0]["times"] = [
            TimeElement(
                start_time=datetime.time(hour=10),
                end_time=datetime.time(hour=12),
                end_time_on_next_day=False,
                resource_state=State.WITH_RESERVATION.value,
            ),
            TimeElement(
                start_time=datetime.time(hour=15),
                end_time=datetime.time(hour=18),
                end_time_on_next_day=False,
                resource_state=State.WITH_RESERVATION.value,
            ),
        ]
        mock.return_value = dates
        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)
        begin = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T12:00")
        end = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T13:00")
        is_open = client.is_resource_reservable(str(self.reservation_unit.uuid), begin, end)
        assert_that(is_open).is_false()

    def test_is_resource_open_respects_timezone_is_false(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)
        begin = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T06:00+02:00")
        end = datetime.datetime.fromisoformat(f"{DATES[0].year}-0{DATES[0].month}-0{DATES[0].day}T07:00+02:00")

        is_open = client.is_resource_reservable(str(self.reservation_unit.uuid), begin, end)
        assert_that(is_open).is_false()

    def test_next_opening_times_returns_date_and_times(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        client = OpeningHoursClient(
            str(self.reservation_unit.uuid),
            DATES[0],
            DATES[1],
            single=True,
        )
        date, times = client.next_opening_times(
            str(self.reservation_unit.uuid),
            DATES[0],
        )

        assert_that(date).is_equal_to(DATES[0])
        assert_that(times).is_not_empty()

        datetime.datetime.strptime("2021-01-01", "%Y-%m-%d")
        from_date = datetime.date(2020, 12, 1)
        date, times = client.next_opening_times(str(self.reservation_unit.uuid), from_date)
        assert_that(date).is_equal_to(DATES[0])
        assert_that(times).is_not_empty()

    def test_next_opening_times_returns_empty_time(self, mock):
        mock.return_value = self.get_mocked_opening_hours()
        from_date = datetime.date(2022, 1, 1)
        client = OpeningHoursClient(
            str(self.reservation_unit.uuid),
            DATES[0],
            DATES[1],
            single=True,
        )
        date, times = client.next_opening_times(
            str(self.reservation_unit.uuid),
            from_date,
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
            hauki_origin_id=self.unit.hauki_resource_data_source_id,
        )
        origin_id = mock.call_args.args[3]
        assert_that(origin_id).is_same_as(self.unit.hauki_resource_data_source_id)

    def test_times_is_not_present_if_length_is_zero(self, mock):
        data = self.get_mocked_opening_hours()
        data[0]["times"][0] = TimeElement(
            start_time=datetime.time(hour=10),
            end_time=datetime.time(hour=10),
            end_time_on_next_day=False,
            resource_state=State.OPEN_AND_RESERVABLE.value,
        )

        mock.return_value = data
        client = OpeningHoursClient(
            str(self.reservation_unit.uuid),
            DATES[0],
            DATES[1],
            single=True,
        )
        times = client.get_opening_hours_for_resource(
            str(self.reservation_unit.uuid),
            DATES[0],
        )
        assert_that(len(times)).is_zero()

    def test_closed_time_affects_open_time_start(self, mock):
        data = self.get_mocked_opening_hours()
        data[0]["times"].append(
            TimeElement(
                start_time=datetime.time(hour=8),
                end_time=datetime.time(hour=13),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            )
        )
        mock.return_value = data

        client = OpeningHoursClient(
            str(self.reservation_unit.uuid),
            DATES[0],
            DATES[1],
            single=True,
        )

        begin_1 = datetime.datetime.combine(
            DATES[0],
            datetime.time(8),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end_1 = datetime.datetime.combine(
            DATES[0],
            datetime.time(13),
            tzinfo=DEFAULT_TIMEZONE,
        )

        begin_2 = datetime.datetime.combine(
            DATES[0],
            datetime.time(13),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end_2 = datetime.datetime.combine(
            DATES[0],
            datetime.time(22),
            tzinfo=DEFAULT_TIMEZONE,
        )

        times = client.get_opening_hours_for_resource(
            str(self.reservation_unit.uuid),
            DATES[0],
        )

        assert_that(len(times)).is_equal_to(2)

        assert_that(times[0].start_time).is_equal_to(begin_1)
        assert_that(times[0].end_time).is_equal_to(end_1)
        assert_that(times[0].resource_state).is_equal_to(State.MAINTENANCE.value)

        assert_that(times[1].start_time).is_equal_to(begin_2)
        assert_that(times[1].end_time).is_equal_to(end_2)
        assert_that(times[1].resource_state).is_equal_to(
            State.OPEN_AND_RESERVABLE.value,
        )

    def test_closed_time_affects_open_time_end(self, mock):
        data = self.get_mocked_opening_hours()
        data[0]["times"].append(
            TimeElement(
                start_time=datetime.time(hour=20),
                end_time=datetime.time(hour=23),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            )
        )
        mock.return_value = data

        client = OpeningHoursClient(
            str(self.reservation_unit.uuid),
            DATES[0],
            DATES[1],
            single=True,
        )

        begin_1 = datetime.datetime.combine(
            DATES[0],
            datetime.time(10),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end_1 = datetime.datetime.combine(
            DATES[0],
            datetime.time(20),
            tzinfo=DEFAULT_TIMEZONE,
        )

        begin_2 = datetime.datetime.combine(
            DATES[0],
            datetime.time(20),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end_2 = datetime.datetime.combine(
            DATES[0],
            datetime.time(23),
            tzinfo=DEFAULT_TIMEZONE,
        )

        times = client.get_opening_hours_for_resource(
            str(self.reservation_unit.uuid),
            DATES[0],
        )
        assert_that(len(times)).is_equal_to(2)

        assert_that(times[0].start_time).is_equal_to(begin_1)
        assert_that(times[0].end_time).is_equal_to(end_1)
        assert_that(times[0].resource_state).is_equal_to(
            State.OPEN_AND_RESERVABLE.value,
        )

        assert_that(times[1].start_time).is_equal_to(begin_2)
        assert_that(times[1].end_time).is_equal_to(end_2)
        assert_that(times[1].resource_state).is_equal_to(State.MAINTENANCE.value)

    def test_closed_time_inside_open_time_creates_two_open_times(self, mock):
        data = self.get_mocked_opening_hours()
        data[0]["times"].append(
            TimeElement(
                start_time=datetime.time(hour=15),
                end_time=datetime.time(hour=18),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            )
        )
        mock.return_value = data

        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)

        begin_1 = datetime.datetime.combine(DATES[0], datetime.time(10), tzinfo=DEFAULT_TIMEZONE)
        end_1 = datetime.datetime.combine(DATES[0], datetime.time(15), tzinfo=DEFAULT_TIMEZONE)

        begin_2 = datetime.datetime.combine(DATES[0], datetime.time(15), tzinfo=DEFAULT_TIMEZONE)
        end_2 = datetime.datetime.combine(DATES[0], datetime.time(18), tzinfo=DEFAULT_TIMEZONE)

        begin_3 = datetime.datetime.combine(DATES[0], datetime.time(18), tzinfo=DEFAULT_TIMEZONE)
        end_3 = datetime.datetime.combine(DATES[0], datetime.time(22), tzinfo=DEFAULT_TIMEZONE)

        times = client.get_opening_hours_for_resource(str(self.reservation_unit.uuid), DATES[0])

        assert_that(len(times)).is_equal_to(3)

        assert_that(times[0].start_time).is_equal_to(begin_1)
        assert_that(times[0].end_time).is_equal_to(end_1)
        assert_that(times[0].resource_state).is_equal_to(State.OPEN_AND_RESERVABLE.value)

        assert_that(times[1].start_time).is_equal_to(begin_2)
        assert_that(times[1].end_time).is_equal_to(end_2)
        assert_that(times[1].resource_state).is_equal_to(State.MAINTENANCE.value)

        assert_that(times[2].start_time).is_equal_to(begin_3)
        assert_that(times[2].end_time).is_equal_to(end_3)
        assert_that(times[2].resource_state).is_equal_to(
            State.OPEN_AND_RESERVABLE.value,
        )

    def test_two_closed_times_inside_open_time_creates_three_open_times(self, mock):
        data = self.get_mocked_opening_hours()
        data[0]["times"] += [
            TimeElement(
                start_time=datetime.time(hour=11),
                end_time=datetime.time(hour=12),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            ),
            TimeElement(
                start_time=datetime.time(hour=15),
                end_time=datetime.time(hour=18),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            ),
        ]
        mock.return_value = data

        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)

        begin_1 = datetime.datetime.combine(
            DATES[0],
            datetime.time(10),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end_1 = datetime.datetime.combine(
            DATES[0],
            datetime.time(11),
            tzinfo=DEFAULT_TIMEZONE,
        )

        begin_2 = datetime.datetime.combine(
            DATES[0],
            datetime.time(11),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end_2 = datetime.datetime.combine(
            DATES[0],
            datetime.time(12),
            tzinfo=DEFAULT_TIMEZONE,
        )

        begin_3 = datetime.datetime.combine(
            DATES[0],
            datetime.time(12),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end_3 = datetime.datetime.combine(
            DATES[0],
            datetime.time(15),
            tzinfo=DEFAULT_TIMEZONE,
        )

        begin_4 = datetime.datetime.combine(
            DATES[0],
            datetime.time(15),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end_4 = datetime.datetime.combine(
            DATES[0],
            datetime.time(18),
            tzinfo=DEFAULT_TIMEZONE,
        )

        begin_5 = datetime.datetime.combine(
            DATES[0],
            datetime.time(18),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end_5 = datetime.datetime.combine(
            DATES[0],
            datetime.time(22),
            tzinfo=DEFAULT_TIMEZONE,
        )

        times = client.get_opening_hours_for_resource(
            str(self.reservation_unit.uuid),
            DATES[0],
        )
        assert_that(len(times)).is_equal_to(5)

        assert_that(times[0].start_time).is_equal_to(begin_1)
        assert_that(times[0].end_time).is_equal_to(end_1)
        assert_that(times[0].resource_state).is_equal_to(
            State.OPEN_AND_RESERVABLE.value,
        )

        assert_that(times[1].start_time).is_equal_to(begin_2)
        assert_that(times[1].end_time).is_equal_to(end_2)
        assert_that(times[1].resource_state).is_equal_to(State.MAINTENANCE.value)

        assert_that(times[2].start_time).is_equal_to(begin_3)
        assert_that(times[2].end_time).is_equal_to(end_3)
        assert_that(times[2].resource_state).is_equal_to(
            State.OPEN_AND_RESERVABLE.value,
        )

        assert_that(times[3].start_time).is_equal_to(begin_4)
        assert_that(times[3].end_time).is_equal_to(end_4)
        assert_that(times[3].resource_state).is_equal_to(State.MAINTENANCE.value)

        assert_that(times[4].start_time).is_equal_to(begin_5)
        assert_that(times[4].end_time).is_equal_to(end_5)
        assert_that(times[4].resource_state).is_equal_to(
            State.OPEN_AND_RESERVABLE.value,
        )

    def test_open_time_inside_closed_time_is_removed(self, mock):
        data = self.get_mocked_opening_hours()
        first_time_element = data[0]["times"][0]
        data[0]["times"][0] = TimeElement(
            start_time=first_time_element.start_time,
            end_time=first_time_element.end_time,
            end_time_on_next_day=first_time_element.end_time_on_next_day,
            resource_state=State.MAINTENANCE.value,
        )
        data[0]["times"].append(
            TimeElement(
                start_time=datetime.time(hour=15),
                end_time=datetime.time(hour=18),
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            )
        )
        mock.return_value = data

        client = OpeningHoursClient(str(self.reservation_unit.uuid), DATES[0], DATES[1], single=True)

        begin = datetime.datetime.combine(
            DATES[0],
            datetime.time(10),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end = datetime.datetime.combine(
            DATES[0],
            datetime.time(22),
            tzinfo=DEFAULT_TIMEZONE,
        )

        times = client.get_opening_hours_for_resource(
            str(self.reservation_unit.uuid),
            DATES[0],
        )
        assert_that(len(times)).is_equal_to(1)
        assert_that(times[0].resource_state).is_equal_to(State.MAINTENANCE.value)
        assert_that(times[0].start_time).is_equal_to(begin)
        assert_that(times[0].end_time).is_equal_to(end)

    def test_two_open_times_are_concatenated(self, mock):
        data = self.get_mocked_opening_hours()
        data[0]["times"].append(
            TimeElement(
                start_time=datetime.time(hour=6),
                end_time=datetime.time(hour=10),
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            )
        )
        mock.return_value = data

        client = OpeningHoursClient(
            str(self.reservation_unit.uuid),
            DATES[0],
            DATES[1],
            single=True,
        )

        begin = datetime.datetime.combine(
            DATES[0],
            datetime.time(6),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end = datetime.datetime.combine(
            DATES[0],
            datetime.time(22),
            tzinfo=DEFAULT_TIMEZONE,
        )

        times = client.get_opening_hours_for_resource(
            str(self.reservation_unit.uuid),
            DATES[0],
        )
        assert_that(len(times)).is_equal_to(1)
        assert_that(times[0].resource_state).is_equal_to(
            State.OPEN_AND_RESERVABLE.value,
        )
        assert_that(times[0].start_time).is_equal_to(begin)
        assert_that(times[0].end_time).is_equal_to(end)

    def test_two_open_times_are_combined(self, mock):
        data = self.get_mocked_opening_hours()
        data[0]["times"].append(
            TimeElement(
                start_time=datetime.time(hour=8),
                end_time=datetime.time(hour=12),
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            )
        )
        mock.return_value = data

        client = OpeningHoursClient(
            str(self.reservation_unit.uuid),
            DATES[0],
            DATES[1],
            single=True,
        )

        begin = datetime.datetime.combine(
            DATES[0],
            datetime.time(8),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end = datetime.datetime.combine(
            DATES[0],
            datetime.time(22),
            tzinfo=DEFAULT_TIMEZONE,
        )

        times = client.get_opening_hours_for_resource(
            str(self.reservation_unit.uuid),
            DATES[0],
        )
        assert_that(len(times)).is_equal_to(1)
        assert_that(times[0].resource_state).is_equal_to(
            State.OPEN_AND_RESERVABLE.value,
        )
        assert_that(times[0].start_time).is_equal_to(begin)
        assert_that(times[0].end_time).is_equal_to(end)

    def test_two_open_times_with_different_states(self, mock):
        data = self.get_mocked_opening_hours()
        data[0]["times"].append(
            TimeElement(
                start_time=datetime.time(hour=8),
                end_time=datetime.time(hour=12),
                end_time_on_next_day=False,
                resource_state=State.OPEN.value,
            )
        )
        mock.return_value = data

        client = OpeningHoursClient(
            str(self.reservation_unit.uuid),
            DATES[0],
            DATES[1],
            single=True,
        )

        begin_1 = datetime.datetime.combine(
            DATES[0],
            datetime.time(8),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end_1 = datetime.datetime.combine(
            DATES[0],
            datetime.time(12),
            tzinfo=DEFAULT_TIMEZONE,
        )

        begin_2 = datetime.datetime.combine(
            DATES[0],
            datetime.time(10),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end_2 = datetime.datetime.combine(
            DATES[0],
            datetime.time(22),
            tzinfo=DEFAULT_TIMEZONE,
        )

        times = client.get_opening_hours_for_resource(
            str(self.reservation_unit.uuid),
            DATES[0],
        )
        assert_that(len(times)).is_equal_to(2)

        assert_that(times[0].resource_state).is_equal_to(State.OPEN.value)
        assert_that(times[0].start_time).is_equal_to(begin_1)
        assert_that(times[0].end_time).is_equal_to(end_1)

        assert_that(times[1].resource_state).is_equal_to(
            State.OPEN_AND_RESERVABLE.value,
        )
        assert_that(times[1].start_time).is_equal_to(begin_2)
        assert_that(times[1].end_time).is_equal_to(end_2)

    def test_two_closed_times_are_concatenated(self, mock):
        data = self.get_mocked_opening_hours()
        first_time_element = data[0]["times"][0]
        data[0]["times"][0] = TimeElement(
            start_time=first_time_element.start_time,
            end_time=first_time_element.end_time,
            end_time_on_next_day=first_time_element.end_time_on_next_day,
            resource_state=State.MAINTENANCE.value,
        )
        data[0]["times"].append(
            TimeElement(
                start_time=datetime.time(hour=6),
                end_time=datetime.time(hour=10),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            )
        )
        mock.return_value = data

        client = OpeningHoursClient(
            str(self.reservation_unit.uuid),
            DATES[0],
            DATES[1],
            single=True,
        )

        begin = datetime.datetime.combine(
            DATES[0],
            datetime.time(6),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end = datetime.datetime.combine(
            DATES[0],
            datetime.time(22),
            tzinfo=DEFAULT_TIMEZONE,
        )

        times = client.get_opening_hours_for_resource(
            str(self.reservation_unit.uuid),
            DATES[0],
        )
        assert_that(len(times)).is_equal_to(1)
        assert_that(times[0].resource_state).is_equal_to(State.MAINTENANCE.value)
        assert_that(times[0].start_time).is_equal_to(begin)
        assert_that(times[0].end_time).is_equal_to(end)

    def test_two_closed_times_are_combined(self, mock):
        data = self.get_mocked_opening_hours()
        first_time_element = data[0]["times"][0]
        data[0]["times"][0] = TimeElement(
            start_time=first_time_element.start_time,
            end_time=first_time_element.end_time,
            end_time_on_next_day=first_time_element.end_time_on_next_day,
            resource_state=State.MAINTENANCE.value,
        )
        data[0]["times"].append(
            TimeElement(
                start_time=datetime.time(hour=8),
                end_time=datetime.time(hour=12),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            )
        )
        mock.return_value = data

        client = OpeningHoursClient(
            str(self.reservation_unit.uuid),
            DATES[0],
            DATES[1],
            single=True,
        )

        begin = datetime.datetime.combine(
            DATES[0],
            datetime.time(8),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end = datetime.datetime.combine(
            DATES[0],
            datetime.time(22),
            tzinfo=DEFAULT_TIMEZONE,
        )

        times = client.get_opening_hours_for_resource(
            str(self.reservation_unit.uuid),
            DATES[0],
        )
        assert_that(len(times)).is_equal_to(1)
        assert_that(times[0].resource_state).is_equal_to(State.MAINTENANCE.value)
        assert_that(times[0].start_time).is_equal_to(begin)
        assert_that(times[0].end_time).is_equal_to(end)

    def test_two_closed_times_with_different_states(self, mock):
        data = self.get_mocked_opening_hours()
        first_time_element = data[0]["times"][0]
        data[0]["times"][0] = TimeElement(
            start_time=first_time_element.start_time,
            end_time=first_time_element.end_time,
            end_time_on_next_day=first_time_element.end_time_on_next_day,
            resource_state=State.MAINTENANCE.value,
        )
        data[0]["times"].append(
            TimeElement(
                start_time=datetime.time(hour=8),
                end_time=datetime.time(hour=12),
                end_time_on_next_day=False,
                resource_state=State.CLOSED.value,
            )
        )
        mock.return_value = data

        client = OpeningHoursClient(
            str(self.reservation_unit.uuid),
            DATES[0],
            DATES[1],
            single=True,
        )

        begin_1 = datetime.datetime.combine(
            DATES[0],
            datetime.time(8),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end_1 = datetime.datetime.combine(
            DATES[0],
            datetime.time(12),
            tzinfo=DEFAULT_TIMEZONE,
        )

        begin_2 = datetime.datetime.combine(
            DATES[0],
            datetime.time(10),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end_2 = datetime.datetime.combine(
            DATES[0],
            datetime.time(22),
            tzinfo=DEFAULT_TIMEZONE,
        )

        times = client.get_opening_hours_for_resource(
            str(self.reservation_unit.uuid),
            DATES[0],
        )
        assert_that(len(times)).is_equal_to(2)

        assert_that(times[0].resource_state).is_equal_to(State.CLOSED.value)
        assert_that(times[0].start_time).is_equal_to(begin_1)
        assert_that(times[0].end_time).is_equal_to(end_1)

        assert_that(times[1].resource_state).is_equal_to(State.MAINTENANCE.value)
        assert_that(times[1].start_time).is_equal_to(begin_2)
        assert_that(times[1].end_time).is_equal_to(end_2)

    def test_neither_open_nor_closed_state_passed_though(self, mock):
        data = self.get_mocked_opening_hours()
        first_time_element = data[0]["times"][0]
        data[0]["times"] = [
            TimeElement(
                start_time=first_time_element.start_time,
                end_time=datetime.time(hour=13),
                end_time_on_next_day=first_time_element.end_time_on_next_day,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            ),
            TimeElement(
                start_time=datetime.time(hour=12),
                end_time=datetime.time(hour=14),
                end_time_on_next_day=False,
                resource_state=State.WEATHER_PERMITTING.value,
            ),
            TimeElement(
                start_time=datetime.time(hour=13),
                end_time=first_time_element.end_time,
                end_time_on_next_day=first_time_element.end_time_on_next_day,
                resource_state=State.MAINTENANCE.value,
            ),
        ]
        mock.return_value = data

        client = OpeningHoursClient(
            str(self.reservation_unit.uuid),
            DATES[0],
            DATES[1],
            single=True,
        )

        begin_1 = datetime.datetime.combine(
            DATES[0],
            datetime.time(10),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end_1 = datetime.datetime.combine(
            DATES[0],
            datetime.time(13),
            tzinfo=DEFAULT_TIMEZONE,
        )

        begin_2 = datetime.datetime.combine(
            DATES[0],
            datetime.time(12),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end_2 = datetime.datetime.combine(
            DATES[0],
            datetime.time(14),
            tzinfo=DEFAULT_TIMEZONE,
        )

        begin_3 = datetime.datetime.combine(
            DATES[0],
            datetime.time(13),
            tzinfo=DEFAULT_TIMEZONE,
        )
        end_3 = datetime.datetime.combine(
            DATES[0],
            datetime.time(22),
            tzinfo=DEFAULT_TIMEZONE,
        )

        times = client.get_opening_hours_for_resource(
            str(self.reservation_unit.uuid),
            DATES[0],
        )
        assert_that(len(times)).is_equal_to(3)

        assert_that(times[0].resource_state).is_equal_to(
            State.OPEN_AND_RESERVABLE.value,
        )
        assert_that(times[0].start_time).is_equal_to(begin_1)
        assert_that(times[0].end_time).is_equal_to(end_1)

        assert_that(times[1].resource_state).is_equal_to(State.WEATHER_PERMITTING.value)
        assert_that(times[1].start_time).is_equal_to(begin_2)
        assert_that(times[1].end_time).is_equal_to(end_2)

        assert_that(times[2].resource_state).is_equal_to(State.MAINTENANCE.value)
        assert_that(times[2].start_time).is_equal_to(begin_3)
        assert_that(times[2].end_time).is_equal_to(end_3)
