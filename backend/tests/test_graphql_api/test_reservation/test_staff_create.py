from __future__ import annotations

import datetime

import freezegun
import pytest

from tilavarauspalvelu.enums import (
    AccessType,
    ADLoginAMR,
    MunicipalityChoice,
    ProfileLoginAMR,
    ReservationStateChoice,
    ReservationTypeChoice,
    ReserveeType,
)
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation, ReservationUnitHierarchy
from tilavarauspalvelu.models.reservation.actions import ReservationActions
from utils.date_utils import DEFAULT_TIMEZONE, local_date, local_datetime, next_hour

from tests.factories import (
    AgeGroupFactory,
    OriginHaukiResourceFactory,
    ReservableTimeSpanFactory,
    ReservationFactory,
    ReservationPurposeFactory,
    ReservationUnitAccessTypeFactory,
    ReservationUnitFactory,
    SpaceFactory,
    UserFactory,
)
from tests.helpers import patch_method

from .helpers import CREATE_STAFF_MUTATION, get_staff_create_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@freezegun.freeze_time("2021-01-01")
def test_reservation__staff_create__reservation_block_whole_day(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory.create(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime.datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )

    user = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(user)

    input_data = {
        "name": "foo",
        "description": "bar",
        "type": ReservationTypeChoice.STAFF.value,
        "beginsAt": datetime.datetime(2023, 1, 1, hour=12).isoformat(),
        "endsAt": datetime.datetime(2023, 1, 1, hour=13).isoformat(),
        "reservationUnit": reservation_unit.pk,
    }

    response = graphql(CREATE_STAFF_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begins_at == datetime.datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.ends_at == datetime.datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == datetime.timedelta(hours=12)
    assert reservation.buffer_time_after == datetime.timedelta(hours=11)


@freezegun.freeze_time("2021-01-01")
def test_reservation__staff_create__reservation_block_whole_day__ignore_given_buffers(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory.create(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime.datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )

    user = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
    graphql.force_login(user)

    input_data = {
        "name": "foo",
        "description": "bar",
        "type": ReservationTypeChoice.STAFF.value,
        "beginsAt": datetime.datetime(2023, 1, 1, hour=12).isoformat(),
        "endsAt": datetime.datetime(2023, 1, 1, hour=13).isoformat(),
        "reservationUnit": reservation_unit.pk,
        "bufferTimeBefore": int(datetime.timedelta(hours=1).total_seconds()),
        "bufferTimeAfter": int(datetime.timedelta(hours=1).total_seconds()),
    }

    response = graphql(CREATE_STAFF_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begins_at == datetime.datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.ends_at == datetime.datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == datetime.timedelta(hours=12)
    assert reservation.buffer_time_after == datetime.timedelta(hours=11)


def test_reservation__staff_create__general_admin_can_create(graphql):
    reservation_unit = ReservationUnitFactory.create()

    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    data = get_staff_create_data(reservation_unit)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.type == ReservationTypeChoice.STAFF


def test_reservation__staff_create__unit_admin_can_create(graphql):
    reservation_unit = ReservationUnitFactory.create()

    admin = UserFactory.create_with_unit_role(units=[reservation_unit.unit])
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


@pytest.mark.parametrize("field", ["type", "beginsAt", "endsAt"])
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
    data["beginsAt"], data["endsAt"] = data["endsAt"], data["beginsAt"]
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot end before it begins"]


def test_reservation__staff_create__begin_date_in_the_past(graphql):
    reservation_unit = ReservationUnitFactory.create()

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    begin = last_hour - datetime.timedelta(days=2)
    end = last_hour + datetime.timedelta(hours=2)

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit, begins_at=begin, ends_at=end)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot begin this much in the past."]


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
    data = get_staff_create_data(reservation_unit, begins_at=begin, ends_at=end)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.begins_at == begin
    assert reservation.ends_at == end


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
    data = get_staff_create_data(reservation_unit, begins_at=begin, ends_at=end)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.begins_at == begin
    assert reservation.ends_at == end


def test_reservation__staff_create__optional_fields(graphql):
    reservation_unit = ReservationUnitFactory.create()

    data = get_staff_create_data(
        reservation_unit,
        ageGroup=AgeGroupFactory.create(minimum=18, maximum=30).pk,
        applyingForFreeOfCharge=True,
        bufferTimeAfter=int(datetime.timedelta(minutes=30).total_seconds()),
        bufferTimeBefore=int(datetime.timedelta(minutes=30).total_seconds()),
        description="Test description",
        freeOfChargeReason="Some reason here.",
        municipality=MunicipalityChoice.HELSINKI.value,
        name="Test reservation",
        numPersons=1,
        purpose=ReservationPurposeFactory.create(name="purpose").pk,
        reserveeAddressCity="Helsinki",
        reserveeAddressStreet="Mannerheimintie 2",
        reserveeAddressZip="00100",
        reserveeEmail="john.doe@example.com",
        reserveeFirstName="John",
        reserveeIdentifier="2882333-2",
        reserveeLastName="Doe",
        reserveeOrganisationName="Test Organisation ry",
        reserveePhone="+358123456789",
        reserveeType=ReserveeType.INDIVIDUAL,
        type=ReservationTypeChoice.BLOCKED,
    )

    graphql.login_with_superuser()
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])

    assert reservation.age_group.maximum == 30
    assert reservation.age_group.minimum == 18
    assert reservation.applying_for_free_of_charge is True
    assert reservation.buffer_time_after == datetime.timedelta(minutes=30)
    assert reservation.buffer_time_before == datetime.timedelta(minutes=30)
    assert reservation.description == "Test description"
    assert reservation.free_of_charge_reason == "Some reason here."
    assert reservation.municipality == MunicipalityChoice.HELSINKI
    assert reservation.name == "Test reservation"
    assert reservation.num_persons == 1
    assert reservation.purpose.name == "purpose"
    assert reservation.reservee_address_city == "Helsinki"
    assert reservation.reservee_address_street == "Mannerheimintie 2"
    assert reservation.reservee_address_zip == "00100"
    assert reservation.reservee_email == "john.doe@example.com"
    assert reservation.reservee_first_name == "John"
    assert reservation.reservee_identifier == "2882333-2"
    assert reservation.reservee_last_name == "Doe"
    assert reservation.reservee_organisation_name == "Test Organisation ry"
    assert reservation.reservee_phone == "+358123456789"
    assert reservation.reservee_type == "INDIVIDUAL"
    assert reservation.type == ReservationTypeChoice.BLOCKED


def test_reservation__staff_create__reservation_overlapping_fails(graphql):
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(spaces=[space])

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    ReservationFactory.create(
        begins_at=begin,
        ends_at=end,
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=reservation_unit,
    )

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit, begins_at=begin, ends_at=end)

    ReservationUnitHierarchy.refresh()

    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation overlaps with existing reservations."]


def test_reservation__staff_create__buffer_times_cause_overlap_fails(graphql):
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(spaces=[space])

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    ReservationFactory.create(
        begins_at=begin + datetime.timedelta(hours=1),
        ends_at=end + datetime.timedelta(hours=1),
        buffer_time_before=datetime.timedelta(minutes=1),
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=reservation_unit,
    )

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit, begins_at=begin, ends_at=end)

    ReservationUnitHierarchy.refresh()

    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation overlaps with existing reservations."]


def test_reservation__staff_create__buffer_times_cause_overlap_fails_with_buffer_time_before(graphql):
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(spaces=[space])

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    ReservationFactory.create(
        begins_at=begin,
        ends_at=end,
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=reservation_unit,
    )

    graphql.login_with_superuser()
    data = get_staff_create_data(
        reservation_unit,
        begins_at=begin + datetime.timedelta(hours=1),
        ends_at=end + datetime.timedelta(hours=1),
        bufferTimeBefore=int(datetime.timedelta(minutes=1).total_seconds()),
    )

    ReservationUnitHierarchy.refresh()

    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation overlaps with existing reservations."]


def test_reservation__staff_create__buffer_times_cause_overlap_fails_with_buffer_time_after(graphql):
    space = SpaceFactory.create()
    reservation_unit = ReservationUnitFactory.create(spaces=[space])

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    ReservationFactory.create(
        begins_at=begin + datetime.timedelta(hours=1),
        ends_at=end + datetime.timedelta(hours=1),
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=reservation_unit,
    )

    graphql.login_with_superuser()
    data = get_staff_create_data(
        reservation_unit,
        begins_at=begin,
        ends_at=end,
        bufferTimeAfter=int(datetime.timedelta(minutes=1).total_seconds()),
    )

    ReservationUnitHierarchy.refresh()

    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation overlaps with existing reservations."]


def test_reservation__staff_create__interval_not_respected_fails(graphql):
    reservation_unit = ReservationUnitFactory.create()

    begin = next_hour(plus_hours=1, plus_minutes=1)
    end = begin + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit, begins_at=begin, ends_at=end)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation start time does not match the reservation unit's allowed start interval.",
    ]


def test_reservation__staff_create__reservation_type_normal_not_accepted(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit, type=ReservationTypeChoice.NORMAL)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Staff users are not allowed to create reservations of this type."]


def test_reservation__staff_create__reservation_type_behalf_accepted(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit, type=ReservationTypeChoice.BEHALF)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.type == ReservationTypeChoice.BEHALF


@pytest.mark.parametrize(
    ("amr", "expected"),
    [
        (ADLoginAMR.HELSINKIAZUREAD, True),
        (ProfileLoginAMR.SUOMI_FI, False),
    ],
)
def test_reservation__staff_create__reservee_used_ad_login(graphql, amr, expected):
    reservation_unit = ReservationUnitFactory.create_reservable_now()
    user = UserFactory.create_superuser(social_auth__extra_data__amr=amr)
    graphql.force_login(user)

    data = get_staff_create_data(reservation_unit)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.reservee_used_ad_login is expected


@patch_method(PindoraService.create_access_code)
def test_reservation__staff_create__access_type__access_code(graphql):
    reservation_unit = ReservationUnitFactory.create(access_types__access_type=AccessType.ACCESS_CODE)

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.access_type == AccessType.ACCESS_CODE

    assert PindoraService.create_access_code.call_count == 1
    assert PindoraService.create_access_code.call_args.kwargs["is_active"] is True


@patch_method(PindoraService.create_access_code)
def test_reservation__staff_create__access_type__changed_to_access_code_in_the_future(graphql):
    reservation_unit = ReservationUnitFactory.create(
        access_types__access_type=AccessType.ACCESS_CODE,
        access_types__begin_date=next_hour(plus_days=2),
    )

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.access_type == AccessType.UNRESTRICTED

    assert PindoraService.create_access_code.call_count == 0


@patch_method(PindoraService.create_access_code)
def test_reservation__staff_create__access_type__access_code_has_ended(graphql):
    today = local_date()

    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.ACCESS_CODE,
        begin_date=today - datetime.timedelta(days=10),
    )
    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.UNRESTRICTED,
        begin_date=today - datetime.timedelta(days=1),
    )

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.access_type == AccessType.UNRESTRICTED

    assert PindoraService.create_access_code.call_count == 0


@patch_method(PindoraService.create_access_code)
def test_reservation__staff_create__access_type__access_code__blocked(graphql):
    reservation_unit = ReservationUnitFactory.create(
        access_types__access_type=AccessType.ACCESS_CODE,
    )

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit, type=ReservationTypeChoice.BLOCKED)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.access_type == AccessType.ACCESS_CODE

    assert PindoraService.create_access_code.call_count == 1
    assert PindoraService.create_access_code.call_args.kwargs["is_active"] is False


@patch_method(PindoraService.create_access_code, side_effect=PindoraAPIError())
@patch_method(SentryLogger.log_exception)
def test_reservation__staff_create__access_type__access_code__pindora_failure(graphql):
    reservation_unit = ReservationUnitFactory.create(
        access_types__access_type=AccessType.ACCESS_CODE,
    )

    graphql.login_with_superuser()
    data = get_staff_create_data(reservation_unit)
    response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    # Reservation is is created, even if Pindora call failed.
    # Access code will be created later in a background task.
    assert response.has_errors is False, response.errors

    assert SentryLogger.log_exception.called is True

    reservation: Reservation | None = Reservation.objects.first()
    assert reservation is not None

    assert reservation.access_type == AccessType.ACCESS_CODE
    assert reservation.access_code_is_active is False
    assert reservation.access_code_generated_at is None


def test_reservation__staff_create__two_overlapping_reservation_created_at_the_same_time(graphql):
    reservation_unit = ReservationUnitFactory.create()

    data = get_staff_create_data(reservation_unit)
    graphql.login_with_superuser()

    ReservationUnitHierarchy.refresh()
    reservation: Reservation | None = None

    def callback(*args, **kwargs):
        nonlocal reservation
        reservation = ReservationFactory.create_for_reservation_unit(
            reservation_unit=reservation_unit,
            begins_at=datetime.datetime.fromisoformat(data["beginsAt"]),
            ends_at=datetime.datetime.fromisoformat(data["endsAt"]),
        )
        return Reservation.objects.filter(pk=reservation.pk)

    with patch_method(ReservationActions.overlapping_reservations, side_effect=callback):
        response = graphql(CREATE_STAFF_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Overlapping reservations were created at the same time."]

    # The other reservation is retained, but might be deleted during its own endpoint
    assert Reservation.objects.first() == reservation
