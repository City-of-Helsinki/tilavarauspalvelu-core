from datetime import date, datetime, time, timedelta, timezone
from unittest import mock

import pytest
from django.conf import settings
from django.utils.timezone import get_default_timezone

from opening_hours.enums import State
from opening_hours.hours import TimeElement
from opening_hours.utils.opening_hours_client import OpeningHoursClient
from reservation_units.models import ReservationUnit

DATES = (
    date(2021, 1, 1),
    date(2021, 1, 2),
)

DEFAULT_TIMEZONE = get_default_timezone()


def tz_offset(hours: int):
    return timezone(timedelta(hours=hours))


def create_datetime(*, hour, tzinfo=DEFAULT_TIMEZONE):
    """Helper function to create datetime with predefined date and timezone."""
    return datetime.combine(DATES[0], time(hour, 0), tzinfo=tzinfo)


def get_opening_hours_client(reservation_unit: ReservationUnit, **kwargs) -> OpeningHoursClient:
    """Helper function to get OpeningHoursClient instance with predefined dates."""
    return OpeningHoursClient(
        resources=str(reservation_unit.uuid),
        start_date=DATES[0],
        end_date=DATES[1],
        **kwargs,
    )


def _get_mocked_opening_hours(reservation_unit, *, first_day_times: list[TimeElement] | None = None):
    resource_id = f"{settings.HAUKI_ORIGIN_ID}:{reservation_unit.uuid}"

    if first_day_times is None:
        first_day_times = [
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=22),
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            ),
        ]

    return [
        {
            "timezone": DEFAULT_TIMEZONE,
            "resource_id": resource_id,
            "origin_id": str(reservation_unit.uuid),
            "date": DATES[0],
            "times": first_day_times,
        },
        {
            "timezone": DEFAULT_TIMEZONE,
            "resource_id": resource_id,
            "origin_id": str(reservation_unit.uuid),
            "date": DATES[1],
            "times": [
                TimeElement(
                    start_time=time(hour=10),
                    end_time=time(hour=22),
                    end_time_on_next_day=False,
                    resource_state=State.OPEN_AND_RESERVABLE.value,
                ),
            ],
        },
    ]


# init


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__init__resources_is_string(mocked_get_opening_hours, reservation_unit):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(reservation_unit)

    OpeningHoursClient(resources=str(reservation_unit.uuid), start_date=DATES[0], end_date=DATES[1])


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__init__resources_is_list(mocked_get_opening_hours, reservation_unit):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(reservation_unit)

    OpeningHoursClient(resources=[str(reservation_unit.uuid)], start_date=DATES[0], end_date=DATES[1])


# refresh_opening_hours


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__refresh_opening_hours(mocked_get_opening_hours, reservation_unit):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(reservation_unit)

    client = get_opening_hours_client(reservation_unit)
    client.refresh_opening_hours()

    assert mocked_get_opening_hours.call_count == 2


# is_resource_reservable


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__is_resource_reservable__true(mocked_get_opening_hours, reservation_unit):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(reservation_unit)

    client = get_opening_hours_client(reservation_unit)
    begin = create_datetime(hour=10)
    end = create_datetime(hour=12)
    is_open = client.is_resource_reservable(str(reservation_unit.uuid), begin, end)

    assert is_open is True


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__is_resource_reservable__false(mocked_get_opening_hours, reservation_unit):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(reservation_unit)

    client = get_opening_hours_client(reservation_unit)
    begin = create_datetime(hour=21)
    end = create_datetime(hour=23)
    is_open = client.is_resource_reservable(str(reservation_unit.uuid), begin, end)

    assert is_open is False


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__is_resource_reservable__respects_timezone__is_open(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(reservation_unit)

    client = get_opening_hours_client(reservation_unit)
    begin = create_datetime(hour=21, tzinfo=tz_offset(4))
    end = create_datetime(hour=23, tzinfo=tz_offset(4))
    is_open = client.is_resource_reservable(str(reservation_unit.uuid), begin, end)

    assert is_open is True


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__is_resource_reservable__respects_timezone__is_closed(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(reservation_unit)

    client = get_opening_hours_client(reservation_unit)
    begin = create_datetime(hour=6, tzinfo=tz_offset(2))
    end = create_datetime(hour=7, tzinfo=tz_offset(2))
    is_open = client.is_resource_reservable(str(reservation_unit.uuid), begin, end)

    assert is_open is False


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__is_resource_reservable__start_end_null(mocked_get_opening_hours, reservation_unit):
    return_value = _get_mocked_opening_hours(reservation_unit)
    time_element = TimeElement(
        start_time=None,
        end_time=None,
        end_time_on_next_day=False,
        resource_state=State.OPEN_AND_RESERVABLE.value,
    )
    return_value[0]["times"][0] = time_element
    return_value[1]["times"][0] = time_element
    mocked_get_opening_hours.return_value = return_value

    client = get_opening_hours_client(reservation_unit)

    begin = create_datetime(hour=10)
    end = create_datetime(hour=12)
    is_open = client.is_resource_reservable(str(reservation_unit.uuid), begin, end)

    assert is_open is True


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__is_resource_reservable__no_times_in_reservable_states(
    mocked_get_opening_hours,
    reservation_unit,
):
    return_value = _get_mocked_opening_hours(reservation_unit)
    return_value[0]["times"] = [
        TimeElement(
            start_time=None,
            end_time=None,
            end_time_on_next_day=False,
            resource_state=State.CLOSED.value,
        )
    ]
    return_value[1]["times"] = [
        TimeElement(
            start_time=None,
            end_time=None,
            end_time_on_next_day=False,
            resource_state=State.OPEN_AND_RESERVABLE.value,
        )
    ]
    mocked_get_opening_hours.return_value = return_value

    client = get_opening_hours_client(reservation_unit)
    begin = create_datetime(hour=10)
    end = create_datetime(hour=12)
    is_open = client.is_resource_reservable(str(reservation_unit.uuid), begin, end)

    assert is_open is False


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__is_resource_reservable__end_time_is_on_next_day(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=6),
                end_time_on_next_day=True,
                resource_state=State.WITH_RESERVATION.value,
            )
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    begin = create_datetime(hour=10)
    end = create_datetime(hour=12)
    is_open = client.is_resource_reservable(str(reservation_unit.uuid), begin, end)

    assert is_open is True


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__is_resource_reservable__multiple_times_available_in_one_day__match_first(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=12),
                end_time_on_next_day=False,
                resource_state=State.WITH_RESERVATION.value,
            ),
            TimeElement(
                start_time=time(hour=15),
                end_time=time(hour=18),
                end_time_on_next_day=False,
                resource_state=State.WITH_RESERVATION.value,
            ),
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    begin = create_datetime(hour=10)
    end = create_datetime(hour=12)
    is_open = client.is_resource_reservable(str(reservation_unit.uuid), begin, end)

    assert is_open is True


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__is_resource_reservable__multiple_times_available_in_one_day__match_second(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=12),
                end_time_on_next_day=False,
                resource_state=State.WITH_RESERVATION.value,
            ),
            TimeElement(
                start_time=time(hour=15),
                end_time=time(hour=18),
                end_time_on_next_day=False,
                resource_state=State.WITH_RESERVATION.value,
            ),
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    begin = create_datetime(hour=15)
    end = create_datetime(hour=16)
    is_open = client.is_resource_reservable(str(reservation_unit.uuid), begin, end)

    assert is_open is True


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__is_resource_reservable__multiple_times_available_in_one_day__no_match(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=12),
                end_time_on_next_day=False,
                resource_state=State.WITH_RESERVATION.value,
            ),
            TimeElement(
                start_time=time(hour=15),
                end_time=time(hour=18),
                end_time_on_next_day=False,
                resource_state=State.WITH_RESERVATION.value,
            ),
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    begin = create_datetime(hour=12)
    end = create_datetime(hour=13)
    is_open = client.is_resource_reservable(str(reservation_unit.uuid), begin, end)

    assert is_open is False


# next_opening_times


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__next_opening_times__returns_date_and_times(mocked_get_opening_hours, reservation_unit):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(reservation_unit)

    client = get_opening_hours_client(reservation_unit)

    # Date matches first available time
    running_date, times = client.next_opening_times(str(reservation_unit.uuid), DATES[0])
    assert running_date == DATES[0]
    assert len(times) > 0

    # Date is in the past
    running_date, times = client.next_opening_times(str(reservation_unit.uuid), date(2020, 12, 1))

    assert running_date == DATES[0]
    assert len(times) > 0


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__next_opening_times__returns_no_times(mocked_get_opening_hours, reservation_unit):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(reservation_unit)

    client = get_opening_hours_client(reservation_unit)

    running_date, times = client.next_opening_times(str(reservation_unit.uuid), date(2022, 1, 1))

    assert running_date is None
    assert times is None


# check origin_id


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__origin_id__default_is_used(mocked_get_opening_hours, reservation_unit):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(reservation_unit)

    get_opening_hours_client(reservation_unit)

    assert mocked_get_opening_hours.call_args.args[3] == settings.HAUKI_ORIGIN_ID


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__origin_id__overridden(mocked_get_opening_hours, reservation_unit):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(reservation_unit)

    get_opening_hours_client(reservation_unit, hauki_origin_id=reservation_unit.unit.hauki_resource_data_source_id)

    assert mocked_get_opening_hours.call_args.args[3] == reservation_unit.unit.hauki_resource_data_source_id


# get_opening_hours_for_resource


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__get_for_resource(mocked_get_opening_hours, reservation_unit):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(reservation_unit)

    client = get_opening_hours_client(reservation_unit)
    times = client.get_opening_hours_for_resource(str(reservation_unit.uuid), DATES[0])

    assert len(times) > 0


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__get_for_resource__start_end_null(mocked_get_opening_hours, reservation_unit):
    return_value = _get_mocked_opening_hours(reservation_unit)
    time_element = TimeElement(
        start_time=None,
        end_time=None,
        end_time_on_next_day=False,
        resource_state=State.CLOSED.value,
    )
    return_value[0]["times"][0] = time_element
    return_value[1]["times"][0] = time_element
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(reservation_unit)

    client = get_opening_hours_client(reservation_unit)
    times = client.get_opening_hours_for_resource(str(reservation_unit.uuid), DATES[0])

    assert len(times) > 0


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__get_for_resource__resource_is_not_listed(mocked_get_opening_hours, reservation_unit):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(reservation_unit)

    client = get_opening_hours_client(reservation_unit)
    times = client.get_opening_hours_for_resource("non-existent", DATES[0])

    assert len(times) == 0


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__get_for_resource__times_is_not_present_if_length_is_zero(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=10),
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            )
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    times = client.get_opening_hours_for_resource(str(reservation_unit.uuid), DATES[0])

    assert len(times) == 0


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__get_for_resource__closed_time_affects_open_time_start(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=22),
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            ),
            TimeElement(
                start_time=time(hour=8),
                end_time=time(hour=13),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            ),
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    times = client.get_opening_hours_for_resource(str(reservation_unit.uuid), DATES[0])

    assert len(times) == 2

    assert times[0].start_time == create_datetime(hour=8)
    assert times[0].end_time == create_datetime(hour=13)
    assert times[0].resource_state == State.MAINTENANCE.value

    assert times[1].start_time == create_datetime(hour=13)
    assert times[1].end_time == create_datetime(hour=22)
    assert times[1].resource_state == State.OPEN_AND_RESERVABLE.value


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__get_for_resource__closed_time_affects_open_time_end(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=22),
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            ),
            TimeElement(
                start_time=time(hour=20),
                end_time=time(hour=23),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            ),
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    times = client.get_opening_hours_for_resource(str(reservation_unit.uuid), DATES[0])

    assert len(times) == 2

    assert times[0].start_time == create_datetime(hour=10)
    assert times[0].end_time == create_datetime(hour=20)
    assert times[0].resource_state == State.OPEN_AND_RESERVABLE.value

    assert times[1].start_time == create_datetime(hour=20)
    assert times[1].end_time == create_datetime(hour=23)
    assert times[1].resource_state == State.MAINTENANCE.value


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__get_for_resource__closed_time_inside_open_time_creates_two_open_times(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=22),
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            ),
            TimeElement(
                start_time=time(hour=15),
                end_time=time(hour=18),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            ),
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    times = client.get_opening_hours_for_resource(str(reservation_unit.uuid), DATES[0])

    assert len(times) == 3

    assert times[0].start_time == create_datetime(hour=10)
    assert times[0].end_time == create_datetime(hour=15)
    assert times[0].resource_state == State.OPEN_AND_RESERVABLE.value

    assert times[1].start_time == create_datetime(hour=15)
    assert times[1].end_time == create_datetime(hour=18)
    assert times[1].resource_state == State.MAINTENANCE.value

    assert times[2].start_time == create_datetime(hour=18)
    assert times[2].end_time == create_datetime(hour=22)
    assert times[2].resource_state == State.OPEN_AND_RESERVABLE.value


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__get_for_resource__two_closed_times_inside_open_time_creates_three_open_times(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=22),
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            ),
            TimeElement(
                start_time=time(hour=11),
                end_time=time(hour=12),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            ),
            TimeElement(
                start_time=time(hour=15),
                end_time=time(hour=18),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            ),
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    times = client.get_opening_hours_for_resource(str(reservation_unit.uuid), DATES[0])

    assert len(times) == 5

    assert times[0].start_time == create_datetime(hour=10)
    assert times[0].end_time == create_datetime(hour=11)
    assert times[0].resource_state == State.OPEN_AND_RESERVABLE.value

    assert times[1].start_time == create_datetime(hour=11)
    assert times[1].end_time == create_datetime(hour=12)
    assert times[1].resource_state == State.MAINTENANCE.value

    assert times[2].start_time == create_datetime(hour=12)
    assert times[2].end_time == create_datetime(hour=15)
    assert times[2].resource_state == State.OPEN_AND_RESERVABLE.value

    assert times[3].start_time == create_datetime(hour=15)
    assert times[3].end_time == create_datetime(hour=18)
    assert times[3].resource_state == State.MAINTENANCE.value

    assert times[4].start_time == create_datetime(hour=18)
    assert times[4].end_time == create_datetime(hour=22)
    assert times[4].resource_state == State.OPEN_AND_RESERVABLE.value


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__get_for_resource__open_time_inside_closed_time_is_removed(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=22),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            ),
            TimeElement(
                start_time=time(hour=15),
                end_time=time(hour=18),
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            ),
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    times = client.get_opening_hours_for_resource(str(reservation_unit.uuid), DATES[0])

    assert len(times) == 1

    assert times[0].start_time == create_datetime(hour=10)
    assert times[0].end_time == create_datetime(hour=22)
    assert times[0].resource_state == State.MAINTENANCE.value


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__get_for_resource__two_non_overlapping_open_times_are_combined(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=22),
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            ),
            TimeElement(
                start_time=time(hour=6),
                end_time=time(hour=10),
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            ),
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    times = client.get_opening_hours_for_resource(str(reservation_unit.uuid), DATES[0])

    assert len(times) == 1

    assert times[0].start_time == create_datetime(hour=6)
    assert times[0].end_time == create_datetime(hour=22)
    assert times[0].resource_state == State.OPEN_AND_RESERVABLE.value


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__get_for_resource__two_overlapping_open_times_are_combined(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=22),
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            ),
            TimeElement(
                start_time=time(hour=8),
                end_time=time(hour=12),
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            ),
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    times = client.get_opening_hours_for_resource(str(reservation_unit.uuid), DATES[0])

    assert len(times) == 1

    assert times[0].start_time == create_datetime(hour=8)
    assert times[0].end_time == create_datetime(hour=22)
    assert times[0].resource_state == State.OPEN_AND_RESERVABLE.value


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__get_for_resource__two_open_times_with_different_states_are_not_combined(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=22),
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            ),
            TimeElement(
                start_time=time(hour=8),
                end_time=time(hour=12),
                end_time_on_next_day=False,
                resource_state=State.OPEN.value,
            ),
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    times = client.get_opening_hours_for_resource(str(reservation_unit.uuid), DATES[0])

    assert len(times) == 2

    assert times[0].start_time == create_datetime(hour=8)
    assert times[0].end_time == create_datetime(hour=12)
    assert times[0].resource_state == State.OPEN.value

    assert times[1].start_time == create_datetime(hour=10)
    assert times[1].end_time == create_datetime(hour=22)
    assert times[1].resource_state == State.OPEN_AND_RESERVABLE.value


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__get_for_resource__two_non_overlapping_closed_times_are_combined(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=22),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            ),
            TimeElement(
                start_time=time(hour=6),
                end_time=time(hour=10),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            ),
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    times = client.get_opening_hours_for_resource(str(reservation_unit.uuid), DATES[0])

    assert len(times) == 1

    assert times[0].start_time == create_datetime(hour=6)
    assert times[0].end_time == create_datetime(hour=22)
    assert times[0].resource_state == State.MAINTENANCE.value


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__get_for_resource__two_overlapping_closed_times_are_combined(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=22),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            ),
            TimeElement(
                start_time=time(hour=8),
                end_time=time(hour=12),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            ),
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    times = client.get_opening_hours_for_resource(str(reservation_unit.uuid), DATES[0])

    assert len(times) == 1

    assert times[0].start_time == create_datetime(hour=8)
    assert times[0].end_time == create_datetime(hour=22)
    assert times[0].resource_state == State.MAINTENANCE.value


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__get_for_resource__two_closed_times_with_different_states_are_not_combined(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=22),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            ),
            TimeElement(
                start_time=time(hour=8),
                end_time=time(hour=12),
                end_time_on_next_day=False,
                resource_state=State.CLOSED.value,
            ),
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    times = client.get_opening_hours_for_resource(str(reservation_unit.uuid), DATES[0])

    assert len(times) == 2

    assert times[0].start_time == create_datetime(hour=8)
    assert times[0].end_time == create_datetime(hour=12)
    assert times[0].resource_state == State.CLOSED.value

    assert times[1].start_time == create_datetime(hour=10)
    assert times[1].end_time == create_datetime(hour=22)
    assert times[1].resource_state == State.MAINTENANCE.value


@mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@pytest.mark.django_db()
def test__opening_hours_client__get_for_resource__neither_open_nor_closed_state_passed_though(
    mocked_get_opening_hours,
    reservation_unit,
):
    mocked_get_opening_hours.return_value = _get_mocked_opening_hours(
        reservation_unit,
        first_day_times=[
            TimeElement(
                start_time=time(hour=10),
                end_time=time(hour=13),
                end_time_on_next_day=False,
                resource_state=State.OPEN_AND_RESERVABLE.value,
            ),
            TimeElement(
                start_time=time(hour=12),
                end_time=time(hour=14),
                end_time_on_next_day=False,
                resource_state=State.WEATHER_PERMITTING.value,
            ),
            TimeElement(
                start_time=time(hour=13),
                end_time=time(hour=22),
                end_time_on_next_day=False,
                resource_state=State.MAINTENANCE.value,
            ),
        ],
    )

    client = get_opening_hours_client(reservation_unit)
    times = client.get_opening_hours_for_resource(str(reservation_unit.uuid), DATES[0])

    assert len(times) == 3

    assert times[0].start_time == create_datetime(hour=10)
    assert times[0].end_time == create_datetime(hour=13)
    assert times[0].resource_state == State.OPEN_AND_RESERVABLE.value

    assert times[1].start_time == create_datetime(hour=12)
    assert times[1].end_time == create_datetime(hour=14)
    assert times[1].resource_state == State.WEATHER_PERMITTING.value

    assert times[2].start_time == create_datetime(hour=13)
    assert times[2].end_time == create_datetime(hour=22)
    assert times[2].resource_state == State.MAINTENANCE.value
