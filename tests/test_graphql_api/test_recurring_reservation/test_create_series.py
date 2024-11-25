import datetime

import pytest

from tilavarauspalvelu.enums import (
    CustomerTypeChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
    ReservationTypeStaffChoice,
)
from tilavarauspalvelu.models import AffectingTimeSpan, RecurringReservation, Reservation, ReservationUnitHierarchy
from utils.date_utils import DEFAULT_TIMEZONE, combine, local_date, local_end_of_day, local_start_of_day

from tests.factories import (
    AbilityGroupFactory,
    AgeGroupFactory,
    CityFactory,
    ReservableTimeSpanFactory,
    ReservationFactory,
    ReservationPurposeFactory,
    ReservationUnitFactory,
    SpaceFactory,
    UserFactory,
)

from .helpers import CREATE_SERIES_MUTATION, get_minimal_series_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_recurring_reservations__create_series(graphql):
    ability_group = AbilityGroupFactory.create()
    age_group = AgeGroupFactory.create()
    reservation_unit = ReservationUnitFactory.create()
    user = graphql.login_with_superuser()

    data = get_minimal_series_data(reservation_unit, user)
    data["name"] = "foo"
    data["description"] = "bar"
    data["abilityGroup"] = ability_group.pk
    data["ageGroup"] = age_group.pk

    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation = RecurringReservation.objects.get(pk=response.first_query_object["pk"])
    assert recurring_reservation.name == "foo"
    assert recurring_reservation.description == "bar"
    assert recurring_reservation.weekdays == "0"
    assert recurring_reservation.begin_date == datetime.date(2024, 1, 1)
    assert recurring_reservation.end_date == datetime.date(2024, 1, 2)
    assert recurring_reservation.begin_time == datetime.time(10, 0, 0)
    assert recurring_reservation.end_time == datetime.time(12, 0, 0)
    assert recurring_reservation.recurrence_in_days == 7
    assert recurring_reservation.reservation_unit == reservation_unit
    assert recurring_reservation.user == user
    assert recurring_reservation.age_group == age_group
    assert recurring_reservation.ability_group == ability_group

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 1

    begin = datetime.datetime(2024, 1, 1, 10, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    end = datetime.datetime(2024, 1, 1, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)

    assert reservations[0].begin.astimezone(DEFAULT_TIMEZONE) == begin
    assert reservations[0].end.astimezone(DEFAULT_TIMEZONE) == end
    assert reservations[0].type == ReservationTypeChoice.STAFF
    assert reservations[0].user == user
    assert reservations[0].age_group == age_group

    assert reservations[0].reservation_units.count() == 1
    assert reservations[0].reservation_units.first() == reservation_unit


def test_recurring_reservations__create_series__reservation_details(graphql):
    age_group = AgeGroupFactory.create()
    purpose = ReservationPurposeFactory.create()
    city = CityFactory.create()
    reservation_unit = ReservationUnitFactory.create()
    user = graphql.login_with_superuser()

    data = get_minimal_series_data(reservation_unit, user)
    data["ageGroup"] = age_group.pk
    data["reservationDetails"]["name"] = "foo"
    data["reservationDetails"]["description"] = "bar"
    data["reservationDetails"]["numPersons"] = 12
    data["reservationDetails"]["state"] = ReservationStateChoice.CONFIRMED.upper()
    data["reservationDetails"]["type"] = ReservationTypeChoice.BEHALF.upper()
    data["reservationDetails"]["workingMemo"] = "memo"
    data["reservationDetails"]["bufferTimeBefore"] = 15 * 60  # 15 mins
    data["reservationDetails"]["bufferTimeAfter"] = 30 * 60  # 30 mins
    data["reservationDetails"]["handledAt"] = datetime.datetime(2023, 1, 1).isoformat(timespec="seconds")
    data["reservationDetails"]["confirmedAt"] = datetime.datetime(2023, 1, 2).isoformat(timespec="seconds")
    data["reservationDetails"]["applyingForFreeOfCharge"] = True
    data["reservationDetails"]["freeOfChargeReason"] = "reason"
    data["reservationDetails"]["reserveeId"] = "id"
    data["reservationDetails"]["reserveeFirstName"] = "User"
    data["reservationDetails"]["reserveeLastName"] = "Admin"
    data["reservationDetails"]["reserveeEmail"] = "user@admin.com"
    data["reservationDetails"]["reserveePhone"] = "0123456789"
    data["reservationDetails"]["reserveeOrganisationName"] = "org"
    data["reservationDetails"]["reserveeAddressStreet"] = "street"
    data["reservationDetails"]["reserveeAddressCity"] = "city"
    data["reservationDetails"]["reserveeAddressZip"] = "cip"
    data["reservationDetails"]["reserveeIsUnregisteredAssociation"] = False
    data["reservationDetails"]["reserveeLanguage"] = "FI"
    data["reservationDetails"]["reserveeType"] = CustomerTypeChoice.BUSINESS.upper()
    data["reservationDetails"]["billingFirstName"] = "Bill"
    data["reservationDetails"]["billingLastName"] = "Admin"
    data["reservationDetails"]["billingEmail"] = "bill@admin.com"
    data["reservationDetails"]["billingPhone"] = "9876543210"
    data["reservationDetails"]["billingAddressStreet"] = "lane"
    data["reservationDetails"]["billingAddressCity"] = "town"
    data["reservationDetails"]["billingAddressZip"] = "postal"
    data["reservationDetails"]["purpose"] = purpose.pk
    data["reservationDetails"]["homeCity"] = city.pk

    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation = RecurringReservation.objects.get(pk=response.first_query_object["pk"])
    reservations: list[Reservation] = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 1

    begin = datetime.datetime(2024, 1, 1, 10, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    end = datetime.datetime(2024, 1, 1, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)

    assert reservations[0].name == "foo"
    assert reservations[0].description == "bar"
    assert reservations[0].num_persons == 12
    assert reservations[0].state == ReservationStateChoice.CONFIRMED
    assert reservations[0].type == ReservationTypeChoice.BEHALF
    assert reservations[0].working_memo == "memo"
    assert reservations[0].begin.astimezone(DEFAULT_TIMEZONE) == begin
    assert reservations[0].end.astimezone(DEFAULT_TIMEZONE) == end
    assert reservations[0].buffer_time_before == datetime.timedelta(minutes=15)
    assert reservations[0].buffer_time_after == datetime.timedelta(minutes=30)
    assert reservations[0].handled_at == datetime.datetime(2023, 1, 1, tzinfo=DEFAULT_TIMEZONE)
    assert reservations[0].confirmed_at == datetime.datetime(2023, 1, 2, tzinfo=DEFAULT_TIMEZONE)
    assert reservations[0].applying_for_free_of_charge is True
    assert reservations[0].free_of_charge_reason == "reason"
    assert reservations[0].reservee_id == "id"
    assert reservations[0].reservee_first_name == "User"
    assert reservations[0].reservee_last_name == "Admin"
    assert reservations[0].reservee_email == "user@admin.com"
    assert reservations[0].reservee_phone == "0123456789"
    assert reservations[0].reservee_organisation_name == "org"
    assert reservations[0].reservee_address_street == "street"
    assert reservations[0].reservee_address_city == "city"
    assert reservations[0].reservee_address_zip == "cip"
    assert reservations[0].reservee_is_unregistered_association is False
    assert reservations[0].reservee_language == "fi"
    assert reservations[0].reservee_type == CustomerTypeChoice.BUSINESS
    assert reservations[0].billing_first_name == "Bill"
    assert reservations[0].billing_last_name == "Admin"
    assert reservations[0].billing_email == "bill@admin.com"
    assert reservations[0].billing_phone == "9876543210"
    assert reservations[0].billing_address_street == "lane"
    assert reservations[0].billing_address_city == "town"
    assert reservations[0].billing_address_zip == "postal"
    assert reservations[0].purpose == purpose
    assert reservations[0].home_city == city
    assert reservations[0].user == user
    assert reservations[0].age_group == age_group
    assert reservations[0].reservation_units.count() == 1
    assert reservations[0].reservation_units.first() == reservation_unit


def test_recurring_reservations__create_series__multiple_recurrences(graphql):
    reservation_unit = ReservationUnitFactory.create()
    user = graphql.login_with_superuser()

    end = datetime.date(2024, 1, 15).isoformat()
    data = get_minimal_series_data(reservation_unit, user, endDate=end)
    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation = RecurringReservation.objects.get(pk=response.first_query_object["pk"])

    assert recurring_reservation.begin_date == datetime.date(2024, 1, 1)
    assert recurring_reservation.end_date == datetime.date(2024, 1, 15)

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 3

    begin = datetime.datetime(2024, 1, 1, 10, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    end = datetime.datetime(2024, 1, 1, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)

    assert reservations[0].begin.astimezone(DEFAULT_TIMEZONE) == begin
    assert reservations[0].end.astimezone(DEFAULT_TIMEZONE) == end

    begin = datetime.datetime(2024, 1, 8, 10, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    end = datetime.datetime(2024, 1, 8, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)

    assert reservations[1].begin.astimezone(DEFAULT_TIMEZONE) == begin
    assert reservations[1].end.astimezone(DEFAULT_TIMEZONE) == end

    begin = datetime.datetime(2024, 1, 15, 10, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    end = datetime.datetime(2024, 1, 15, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)

    assert reservations[2].begin.astimezone(DEFAULT_TIMEZONE) == begin
    assert reservations[2].end.astimezone(DEFAULT_TIMEZONE) == end


def test_recurring_reservations__create_series__multiple_weekdays(graphql):
    reservation_unit = ReservationUnitFactory.create()
    user = graphql.login_with_superuser()

    end = datetime.date(2024, 1, 7).isoformat()
    weekdays = [0, 2, 4]  # Mon, Wed, Fri
    data = get_minimal_series_data(reservation_unit, user, endDate=end, weekdays=weekdays)
    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation = RecurringReservation.objects.get(pk=response.first_query_object["pk"])

    assert recurring_reservation.begin_date == datetime.date(2024, 1, 1)
    assert recurring_reservation.end_date == datetime.date(2024, 1, 7)

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 3

    begin = datetime.datetime(2024, 1, 1, 10, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    end = datetime.datetime(2024, 1, 1, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)

    assert reservations[0].begin.astimezone(DEFAULT_TIMEZONE) == begin
    assert reservations[0].end.astimezone(DEFAULT_TIMEZONE) == end

    begin = datetime.datetime(2024, 1, 3, 10, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    end = datetime.datetime(2024, 1, 3, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)

    assert reservations[1].begin.astimezone(DEFAULT_TIMEZONE) == begin
    assert reservations[1].end.astimezone(DEFAULT_TIMEZONE) == end

    begin = datetime.datetime(2024, 1, 5, 10, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    end = datetime.datetime(2024, 1, 5, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)

    assert reservations[2].begin.astimezone(DEFAULT_TIMEZONE) == begin
    assert reservations[2].end.astimezone(DEFAULT_TIMEZONE) == end


@pytest.mark.parametrize("reservation_type", ReservationTypeStaffChoice.values)
def test_recurring_reservations__create_series__reservation_type(graphql, reservation_type):
    reservation_unit = ReservationUnitFactory.create()
    user = graphql.login_with_superuser()

    data = get_minimal_series_data(reservation_unit, user)
    data["reservationDetails"]["type"] = reservation_type.upper()
    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation = RecurringReservation.objects.get(pk=response.first_query_object["pk"])
    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 1

    assert reservations[0].type == reservation_type


def test_recurring_reservations__create_series__reservation_type__cant_create_normal_reservation(graphql):
    reservation_unit = ReservationUnitFactory.create()
    user = graphql.login_with_superuser()

    data = get_minimal_series_data(reservation_unit, user)
    data["reservationDetails"]["type"] = ReservationTypeChoice.NORMAL.value
    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_schema_errors is True


def test_recurring_reservations__create_series__different_reservation_user(graphql):
    reservation_unit = ReservationUnitFactory.create()
    admin = graphql.login_with_superuser()
    user = UserFactory.create()

    data = get_minimal_series_data(reservation_unit, user)
    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation = RecurringReservation.objects.get(pk=response.first_query_object["pk"])

    assert recurring_reservation.user == admin

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 1

    assert reservations[0].user == user


def test_recurring_reservations__create_series__skip_dates(graphql):
    reservation_unit = ReservationUnitFactory.create()
    user = graphql.login_with_superuser()

    end = datetime.date(2024, 1, 15).isoformat()
    skip = [datetime.date(2024, 1, 8).isoformat()]
    data = get_minimal_series_data(reservation_unit, user, endDate=end, skipDates=skip)
    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation = RecurringReservation.objects.get(pk=response.first_query_object["pk"])

    assert recurring_reservation.begin_date == datetime.date(2024, 1, 1)
    assert recurring_reservation.end_date == datetime.date(2024, 1, 15)

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 2

    begin = datetime.datetime(2024, 1, 1, 10, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    end = datetime.datetime(2024, 1, 1, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)

    assert reservations[0].begin.astimezone(DEFAULT_TIMEZONE) == begin
    assert reservations[0].end.astimezone(DEFAULT_TIMEZONE) == end

    begin = datetime.datetime(2024, 1, 15, 10, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    end = datetime.datetime(2024, 1, 15, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)

    assert reservations[1].begin.astimezone(DEFAULT_TIMEZONE) == begin
    assert reservations[1].end.astimezone(DEFAULT_TIMEZONE) == end


def test_recurring_reservations__create_series__daylight_savings(graphql):
    reservation_unit = ReservationUnitFactory.create()
    user = graphql.login_with_superuser()

    # Daylight savings is on March 31
    begin = datetime.date(2024, 3, 25).isoformat()  # Mon
    end = datetime.date(2024, 4, 1).isoformat()  # Mon
    data = get_minimal_series_data(reservation_unit, user, beginDate=begin, endDate=end)
    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False

    recurring_reservation = RecurringReservation.objects.get(pk=response.first_query_object["pk"])

    assert recurring_reservation.begin_date == datetime.date(2024, 3, 25)
    assert recurring_reservation.end_date == datetime.date(2024, 4, 1)

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 2

    begin_1 = datetime.datetime(2024, 3, 25, 10, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    end_1 = datetime.datetime(2024, 3, 25, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)

    assert reservations[0].begin.astimezone(DEFAULT_TIMEZONE) == begin_1
    assert reservations[0].end.astimezone(DEFAULT_TIMEZONE) == end_1

    begin_2 = datetime.datetime(2024, 4, 1, 10, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    end_2 = datetime.datetime(2024, 4, 1, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)

    assert reservations[1].begin.astimezone(DEFAULT_TIMEZONE) == begin_2
    assert reservations[1].end.astimezone(DEFAULT_TIMEZONE) == end_2

    # Double check that we did indeed cross the daylight savings time
    assert begin_1.utcoffset() != begin_2.utcoffset()


@pytest.mark.parametrize(
    "missing",
    [
        "weekdays",
        "beginDate",
        "endDate",
        "beginTime",
        "endTime",
        "recurrenceInDays",
        "reservationDetails",
    ],
)
def test_recurring_reservations__create_series__missing_arguments(graphql, missing):
    reservation_unit = ReservationUnitFactory.create()
    user = graphql.login_with_superuser()

    data = get_minimal_series_data(reservation_unit, user)
    data.pop(missing)
    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_schema_errors is True


def test_recurring_reservations__create_series__check_opening_hours__missing_hours(graphql):
    reservation_unit = ReservationUnitFactory.create()
    user = graphql.login_with_superuser()

    data = get_minimal_series_data(reservation_unit, user, checkOpeningHours=True)
    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is True
    assert response.error_message() == "Not all reservations can be made due to falling outside reservable times."
    assert response.errors[0]["extensions"]["not_reservable"] == [
        {
            "begin": "2024-01-01T10:00:00+02:00",
            "end": "2024-01-01T12:00:00+02:00",
        },
    ]

    # Assure that the series was not created, and no reservations either
    assert RecurringReservation.objects.count() == 0
    assert Reservation.objects.count() == 0


def test_recurring_reservations__create_series__check_opening_hours__no_missing_hours(graphql):
    reservation_unit = ReservationUnitFactory.create(origin_hauki_resource__id="987")

    begin = datetime.date(2024, 1, 1)
    end = datetime.date(2024, 1, 8)

    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=local_start_of_day(begin),
        end_datetime=local_end_of_day(end),
    )

    user = graphql.login_with_superuser()

    data = get_minimal_series_data(
        reservation_unit,
        user,
        checkOpeningHours=True,
        beginDate=begin.isoformat(),
        endDate=end.isoformat(),
    )
    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    recurring_reservation = RecurringReservation.objects.get(pk=response.first_query_object["pk"])
    assert recurring_reservation.begin_date == datetime.date(2024, 1, 1)
    assert recurring_reservation.end_date == datetime.date(2024, 1, 8)

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 2

    begin = datetime.datetime(2024, 1, 1, 10, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    end = datetime.datetime(2024, 1, 1, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)

    assert reservations[0].begin.astimezone(DEFAULT_TIMEZONE) == begin
    assert reservations[0].end.astimezone(DEFAULT_TIMEZONE) == end

    begin = datetime.datetime(2024, 1, 8, 10, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    end = datetime.datetime(2024, 1, 8, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)

    assert reservations[1].begin.astimezone(DEFAULT_TIMEZONE) == begin
    assert reservations[1].end.astimezone(DEFAULT_TIMEZONE) == end


def test_recurring_reservations__create_series__check_opening_hours__partially_missing_hours(graphql):
    reservation_unit = ReservationUnitFactory.create(origin_hauki_resource__id="987")

    begin = datetime.date(2024, 1, 1)
    end = datetime.date(2024, 1, 8)

    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=local_start_of_day(begin),
        end_datetime=local_end_of_day(begin),
    )

    user = graphql.login_with_superuser()

    data = get_minimal_series_data(
        reservation_unit,
        user,
        checkOpeningHours=True,
        beginDate=begin.isoformat(),
        endDate=end.isoformat(),
    )
    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is True
    assert response.error_message() == "Not all reservations can be made due to falling outside reservable times."
    assert response.errors[0]["extensions"]["not_reservable"] == [
        {
            "begin": "2024-01-08T10:00:00+02:00",
            "end": "2024-01-08T12:00:00+02:00",
        },
    ]

    # Assure that the series was not created, and no reservations either
    assert RecurringReservation.objects.count() == 0
    assert Reservation.objects.count() == 0


def test_recurring_reservations__create_series__check_opening_hours__skip_dates_where_missing_hours(graphql):
    reservation_unit = ReservationUnitFactory.create(origin_hauki_resource__id="987")

    begin = datetime.date(2024, 1, 1)
    end = datetime.date(2024, 1, 8)

    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=local_start_of_day(begin),
        end_datetime=local_end_of_day(begin),
    )

    user = graphql.login_with_superuser()

    data = get_minimal_series_data(
        reservation_unit,
        user,
        checkOpeningHours=True,
        beginDate=begin.isoformat(),
        endDate=end.isoformat(),
        skipDates=[end.isoformat()],
    )
    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    recurring_reservation = RecurringReservation.objects.get(pk=response.first_query_object["pk"])
    assert recurring_reservation.begin_date == datetime.date(2024, 1, 1)
    assert recurring_reservation.end_date == datetime.date(2024, 1, 8)

    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 1

    begin = datetime.datetime(2024, 1, 1, 10, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    end = datetime.datetime(2024, 1, 1, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)

    assert reservations[0].begin.astimezone(DEFAULT_TIMEZONE) == begin
    assert reservations[0].end.astimezone(DEFAULT_TIMEZONE) == end


def test_recurring_reservations__create_series__overlapping_reservations(graphql):
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(spaces=[space])
    user = graphql.login_with_superuser()
    next_year = local_date().year + 1

    start = datetime.date(next_year, 1, 1)
    end = datetime.date(next_year, 1, 8)
    reservation_begin = combine(end, datetime.time(10), tzinfo=DEFAULT_TIMEZONE)
    reservation_end = combine(end, datetime.time(12), tzinfo=DEFAULT_TIMEZONE)

    ReservationFactory.create(
        reservation_units=[reservation_unit],
        begin=reservation_begin,
        end=reservation_end,
        state=ReservationStateChoice.CONFIRMED,
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    data = get_minimal_series_data(
        reservation_unit,
        user,
        weekdays=[start.weekday()],
        beginDate=start.isoformat(),
        endDate=end.isoformat(),
    )
    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is True
    assert response.error_message() == "Not all reservations can be made due to overlapping reservations."
    assert response.errors[0]["extensions"]["overlapping"] == [
        {
            "begin": f"{next_year}-01-08T10:00:00+02:00",
            "end": f"{next_year}-01-08T12:00:00+02:00",
        },
    ]

    # Assure that the series was not created, and no reservations either
    assert RecurringReservation.objects.count() == 0
    assert Reservation.objects.count() == 1  # The overlapping reservation still exists


def test_recurring_reservations__create_series__block_whole_day(graphql):
    reservation_unit = ReservationUnitFactory.create(reservation_block_whole_day=True)
    user = graphql.login_with_superuser()

    data = get_minimal_series_data(reservation_unit, user)
    response = graphql(CREATE_SERIES_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    recurring_reservation = RecurringReservation.objects.get(pk=response.first_query_object["pk"])
    reservations = list(recurring_reservation.reservations.order_by("begin").all())
    assert len(reservations) == 1

    assert reservations[0].begin == datetime.datetime(2024, 1, 1, 10, 0, 0, tzinfo=DEFAULT_TIMEZONE)
    assert reservations[0].end == datetime.datetime(2024, 1, 1, 12, 0, 0, tzinfo=DEFAULT_TIMEZONE)

    assert reservations[0].buffer_time_before == datetime.timedelta(hours=10)
    assert reservations[0].buffer_time_after == datetime.timedelta(hours=12)
