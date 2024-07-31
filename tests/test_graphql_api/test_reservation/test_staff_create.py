import datetime

import freezegun
import pytest
from django.utils.timezone import get_default_timezone

from common.date_utils import local_datetime, next_hour, timedelta_to_json
from reservation_units.models import ReservationUnitHierarchy
from reservations.enums import ReservationStateChoice, ReservationTypeChoice
from reservations.models import Reservation
from tests.factories import (
    AgeGroupFactory,
    CityFactory,
    OriginHaukiResourceFactory,
    RecurringReservationFactory,
    ReservableTimeSpanFactory,
    ReservationFactory,
    ReservationPurposeFactory,
    ReservationUnitFactory,
    SpaceFactory,
    UserFactory,
)

from .helpers import CREATE_STAFF_MUTATION, get_staff_create_data

DEFAULT_TIMEZONE = get_default_timezone()

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@freezegun.freeze_time("2021-01-01")
def test_reservation__staff_create__reservation_block_whole_day(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime.datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )

    user = UserFactory.create_with_unit_permissions(reservation_unit.unit, perms=["can_create_staff_reservations"])
    graphql.force_login(user)

    input_data = {
        "name": "foo",
        "description": "bar",
        "type": ReservationTypeChoice.STAFF.value,
        "begin": datetime.datetime(2023, 1, 1, hour=12).isoformat(),
        "end": datetime.datetime(2023, 1, 1, hour=13).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
    }

    response = graphql(CREATE_STAFF_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime.datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime.datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == datetime.timedelta(hours=12)
    assert reservation.buffer_time_after == datetime.timedelta(hours=11)


@freezegun.freeze_time("2021-01-01")
def test_reservation__staff_create__reservation_block_whole_day__ignore_given_buffers(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime.datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )

    user = UserFactory.create_with_unit_permissions(reservation_unit.unit, perms=["can_create_staff_reservations"])
    graphql.force_login(user)

    input_data = {
        "name": "foo",
        "description": "bar",
        "type": ReservationTypeChoice.STAFF.value,
        "begin": datetime.datetime(2023, 1, 1, hour=12).isoformat(),
        "end": datetime.datetime(2023, 1, 1, hour=13).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
        "bufferTimeBefore": timedelta_to_json(datetime.timedelta(hours=1)),
        "bufferTimeAfter": timedelta_to_json(datetime.timedelta(hours=1)),
    }

    response = graphql(CREATE_STAFF_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime.datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime.datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == datetime.timedelta(hours=12)
    assert reservation.buffer_time_after == datetime.timedelta(hours=11)


def test_reservation__staff_create__general_admin_can_create(graphql):
    reservation_unit = ReservationUnitFactory.create()

    admin = UserFactory.create_with_general_permissions(perms=["can_create_staff_reservations"])
    graphql.force_login(admin)

    data = get_staff_create_data(reservation_unit)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.type == ReservationTypeChoice.STAFF


def test_reservation__staff_create__unit_admin_can_create(graphql):
    reservation_unit = ReservationUnitFactory.create()

    admin = UserFactory.create_with_unit_permissions(
        unit=reservation_unit.unit,
        perms=["can_create_staff_reservations"],
    )
    graphql.force_login(admin)

    data = get_staff_create_data(reservation_unit)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.type == ReservationTypeChoice.STAFF


def test_reservation__staff_create__regular_user_cannot_create(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_regular_user()

    data = get_staff_create_data(reservation_unit)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "No permission to create."
    assert Reservation.objects.exists() is False


@pytest.mark.parametrize("field", ["type", "begin", "end"])
def test_reservation__staff_create__missing_fields(graphql, field):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit)
    data.pop(field)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is True, response


def test_reservation__staff_create__end_before_begin(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit)
    data["begin"], data["end"] = data["end"], data["begin"]
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "End cannot be before begin"


def test_reservation__staff_create__begin_date_in_the_past(graphql):
    reservation_unit = ReservationUnitFactory.create()

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    begin = last_hour - datetime.timedelta(days=1)
    end = last_hour + datetime.timedelta(hours=2)

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation begin date cannot be in the past."


@freezegun.freeze_time(datetime.datetime(2021, 1, 5, hour=12, minute=15, tzinfo=DEFAULT_TIMEZONE))
def test_reservation__staff_create__begin_date_in_the_past__today(graphql):
    #
    # Allow staff members to create reservations to an earlier time today.
    #
    reservation_unit = ReservationUnitFactory.create()

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    begin = last_hour - datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.begin == begin
    assert reservation.end == end


@freezegun.freeze_time(datetime.datetime(2021, 1, 5, hour=0, minute=15, tzinfo=DEFAULT_TIMEZONE))
def test_reservation__staff_create__begin_date_in_the_past__move_to_yesterday_on_first_hour_of_day(graphql):
    #
    # We allow booking the reservation for the previous day if it's the first hour of the day.
    #
    reservation_unit = ReservationUnitFactory.create()

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    begin = last_hour - datetime.timedelta(days=1)
    end = last_hour + datetime.timedelta(hours=2)

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.begin == begin
    assert reservation.end == end


def test_reservation__staff_create__optional_fields(graphql):
    reservation_unit = ReservationUnitFactory.create()

    data = get_staff_create_data(
        reservation_unit,
        type=ReservationTypeChoice.BLOCKED,
        reserveeType="individual",
        reserveeFirstName="John",
        reserveeLastName="Doe",
        reserveeOrganisationName="Test Organisation ry",
        reserveePhone="+358123456789",
        reserveeEmail="john.doe@example.com",
        reserveeId="2882333-2",
        reserveeIsUnregisteredAssociation=False,
        reserveeAddressStreet="Mannerheimintie 2",
        reserveeAddressCity="Helsinki",
        reserveeAddressZip="00100",
        billingFirstName="Jane",
        billingLastName="Doe",
        billingPhone="+358234567890",
        billingEmail="jane.doe@example.com",
        billingAddressStreet="Auratie 12B",
        billingAddressCity="Turku",
        billingAddressZip="20100",
        homeCityPk=CityFactory.create(name="Helsinki").pk,
        ageGroupPk=AgeGroupFactory.create(minimum=18, maximum=30).pk,
        applyingForFreeOfCharge=True,
        freeOfChargeReason="Some reason here.",
        name="Test reservation",
        description="Test description",
        numPersons=1,
        purposePk=ReservationPurposeFactory.create(name="purpose").pk,
        bufferTimeBefore="00:30:00",
        bufferTimeAfter="00:30:00",
        recurringReservationPk=RecurringReservationFactory(reservation_unit=reservation_unit).pk,
    )

    graphql.login_with_superuser()
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.type == ReservationTypeChoice.BLOCKED
    assert reservation.reservee_type == "individual"
    assert reservation.reservee_first_name == "John"
    assert reservation.reservee_last_name == "Doe"
    assert reservation.reservee_organisation_name == "Test Organisation ry"
    assert reservation.reservee_phone == "+358123456789"
    assert reservation.reservee_email == "john.doe@example.com"
    assert reservation.reservee_id == "2882333-2"
    assert reservation.reservee_is_unregistered_association is False
    assert reservation.reservee_address_street == "Mannerheimintie 2"
    assert reservation.reservee_address_city == "Helsinki"
    assert reservation.reservee_address_zip == "00100"
    assert reservation.billing_first_name == "Jane"
    assert reservation.billing_last_name == "Doe"
    assert reservation.billing_phone == "+358234567890"
    assert reservation.billing_email == "jane.doe@example.com"
    assert reservation.billing_address_street == "Auratie 12B"
    assert reservation.billing_address_city == "Turku"
    assert reservation.billing_address_zip == "20100"
    assert reservation.home_city.name == "Helsinki"
    assert reservation.age_group.minimum == 18
    assert reservation.age_group.maximum == 30
    assert reservation.applying_for_free_of_charge is True
    assert reservation.free_of_charge_reason == "Some reason here."
    assert reservation.name == "Test reservation"
    assert reservation.description == "Test description"
    assert reservation.num_persons == 1
    assert reservation.purpose.name == "purpose"
    assert reservation.buffer_time_before == datetime.timedelta(minutes=30)
    assert reservation.buffer_time_after == datetime.timedelta(minutes=30)
    assert reservation.recurring_reservation.pk == data["recurringReservationPk"]


def test_reservation__staff_create__reservation_overlapping_fails(graphql):
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(spaces=[space])

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    ReservationFactory.create(
        begin=begin,
        end=end,
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit],
    )

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit, begin=begin, end=end)

    ReservationUnitHierarchy.refresh()

    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Overlapping reservations are not allowed."


def test_reservation__staff_create__buffer_times_cause_overlap_fails(graphql):
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(spaces=[space])

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    ReservationFactory.create(
        begin=begin + datetime.timedelta(hours=1),
        end=end + datetime.timedelta(hours=1),
        buffer_time_before=datetime.timedelta(minutes=1),
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit],
    )

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit, begin=begin, end=end)

    ReservationUnitHierarchy.refresh()

    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation overlaps with reservation after due to buffer time."


def test_reservation__staff_create__buffer_times_cause_overlap_fails_with_buffer_time_before(graphql):
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(spaces=[space])

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    ReservationFactory.create(
        begin=begin,
        end=end,
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit],
    )

    graphql.login_with_superuser()
    data = get_staff_create_data(
        reservation_unit,
        begin=begin + datetime.timedelta(hours=1),
        end=end + datetime.timedelta(hours=1),
        bufferTimeBefore="00:01:00",
    )

    ReservationUnitHierarchy.refresh()

    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation overlaps with reservation before due to buffer time."


def test_reservation__staff_create__buffer_times_cause_overlap_fails_with_buffer_time_after(graphql):
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(spaces=[space])

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    ReservationFactory.create(
        begin=begin + datetime.timedelta(hours=1),
        end=end + datetime.timedelta(hours=1),
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit],
    )

    graphql.login_with_superuser()
    data = get_staff_create_data(
        reservation_unit,
        begin=begin,
        end=end,
        bufferTimeAfter="00:01:00",
    )

    ReservationUnitHierarchy.refresh()

    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation overlaps with reservation after due to buffer time."


def test_reservation__staff_create__interval_not_respected_fails(graphql):
    reservation_unit = ReservationUnitFactory.create()

    begin = next_hour(plus_hours=1, plus_minutes=1)
    end = begin + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Reservation start time does not match the allowed interval of 15 minutes."


def test_reservation__staff_create__reservation_type_normal_not_accepted(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit, type=ReservationTypeChoice.NORMAL)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == (
        "Reservation type normal is not allowed in this mutation. Allowed choices are blocked, staff, behalf."
    )


def test_reservation__staff_create__reservation_type_behalf_accepted(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit, type=ReservationTypeChoice.BEHALF)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.type == ReservationTypeChoice.BEHALF
