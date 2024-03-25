import datetime
from decimal import Decimal

import freezegun
import pytest
from django.utils.timezone import get_default_timezone

from common.date_utils import local_datetime
from reservation_units.enums import PriceUnit, PricingStatus, ReservationKind
from reservations.choices import CustomerTypeChoice, ReservationStateChoice, ReservationTypeChoice
from reservations.models import Reservation
from tests.factories import (
    AgeGroupFactory,
    ApplicationRoundFactory,
    CityFactory,
    OriginHaukiResourceFactory,
    ReservableTimeSpanFactory,
    ReservationFactory,
    ReservationPurposeFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
    SpaceFactory,
    UserFactory,
)
from tests.helpers import UserType
from users.helauth.utils import ADLoginAMR
from utils.decimal_utils import round_decimal

from .helpers import CREATE_MUTATION, get_create_data, mock_profile_reader

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

DEFAULT_TIMEZONE = get_default_timezone()


def test_reservation__create__success(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert Reservation.objects.count() == 1


def test_reservation__create__with_additional_data(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    age_group = AgeGroupFactory.create(minimum=18, maximum=30)
    city = CityFactory.create(name="Helsinki")
    purpose = ReservationPurposeFactory.create(name="Test purpose")

    additional_data = {
        "name": "Test reservation",
        "description": "Test description",
        "numPersons": 1,
        "applyingForFreeOfCharge": True,
        "freeOfChargeReason": "Free of charge reason",
        "reserveeId": "2882333-2",
        "reserveeFirstName": "John",
        "reserveeLastName": "Doe",
        "reserveeEmail": "john.doe@example.com",
        "reserveePhone": "+358123456789",
        "reserveeAddressStreet": "Mannerheimintie 2",
        "reserveeAddressCity": "Helsinki",
        "reserveeAddressZip": "00100",
        "reserveeIsUnregisteredAssociation": False,
        "reserveeOrganisationName": "Test Organisation ry",
        "reserveeType": CustomerTypeChoice.INDIVIDUAL.value,
        "billingFirstName": "Jane",
        "billingLastName": "Doe",
        "billingEmail": "jane.doe@example.com",
        "billingPhone": "+358234567890",
        "billingAddressStreet": "Auratie 12B",
        "billingAddressCity": "Turku",
        "billingAddressZip": "20100",
        "ageGroupPk": age_group.pk,
        "homeCityPk": city.pk,
        "purposePk": purpose.pk,
    }

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, **additional_data)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert Reservation.objects.count() == 1


def test_reservation__create__with_reservation_language_succeed(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, reserveeLanguage="fi")
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.reservee_language == "fi"


def test_reservation__create__use_longest_buffer_times_if_reserving_multiple_reservation_units(graphql):
    #
    # Currently (March 2024) reserving multiple reservation units is not supported
    # in the UI, but it is planned to be implemented in the future (at some point).
    #
    reservation_unit_1 = ReservationUnitFactory.create_reservable_now(
        sku="foo",
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
    )
    reservation_unit_2 = ReservationUnitFactory.create_reservable_now(
        sku="foo",
        buffer_time_before=datetime.timedelta(minutes=90),
        buffer_time_after=datetime.timedelta(),
    )
    reservation_unit_3 = ReservationUnitFactory.create_reservable_now(
        sku="foo",
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(minutes=15),
    )

    data = get_create_data(
        reservation_unit_1,
        reservationUnitPks=[reservation_unit_1.pk, reservation_unit_2.pk, reservation_unit_3.pk],
    )
    graphql.login_with_superuser()
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.buffer_time_before == reservation_unit_2.buffer_time_before
    assert reservation.buffer_time_after == reservation_unit_3.buffer_time_after


def test_reservation__create__cannot_set_reservation_price(graphql):
    #
    # Reservation price is always calculated, so check that it cannot be set in the request.
    #
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, price=10)
    response = graphql(CREATE_MUTATION, input_data=data)

    # This is just a GraphQL schema error, it doesn't really matter what the error is
    # so long as we cannot set prices for reservations.
    assert response.error_message().startswith("Variable '$input'")

    assert Reservation.objects.exists() is False


def test_reservation__create__overlapping_reservation(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    # An overlapping reservation
    ReservationFactory.create(
        begin=begin,
        end=end,
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit],
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Overlapping reservations are not allowed."


@pytest.mark.parametrize("reservation_type", [ReservationTypeChoice.BLOCKED, ReservationTypeChoice.NORMAL])
def test_reservation__create__overlaps_with_buffer_of_reservation_before(graphql, reservation_type):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    ReservationFactory.create(
        begin=begin - datetime.timedelta(hours=1),
        end=end - datetime.timedelta(hours=1),
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit],
        buffer_time_after=datetime.timedelta(minutes=1),
        type=reservation_type,
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    if reservation_type == ReservationTypeChoice.BLOCKED:
        assert response.has_errors is False, response.errors
    else:
        assert response.error_message() == "Reservation overlaps with reservation before due to buffer time."


@pytest.mark.parametrize("reservation_type", [ReservationTypeChoice.BLOCKED, ReservationTypeChoice.NORMAL])
def test_reservation__create__overlaps_with_buffer_of_reservation_after(graphql, reservation_type):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    ReservationFactory.create(
        begin=begin + datetime.timedelta(hours=1),
        end=end + datetime.timedelta(hours=1),
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit],
        buffer_time_before=datetime.timedelta(minutes=1),
        type=reservation_type,
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    if reservation_type == ReservationTypeChoice.BLOCKED:
        assert response.has_errors is False, response.errors
    else:
        assert response.error_message() == "Reservation overlaps with reservation after due to buffer time."


@pytest.mark.parametrize("reservation_type", [ReservationTypeChoice.BLOCKED, ReservationTypeChoice.NORMAL])
def test_reservation__create__reservation_unit_buffer_time_overlaps_with_reservation_before(graphql, reservation_type):
    reservation_unit = ReservationUnitFactory.create_reservable_now(
        buffer_time_before=datetime.timedelta(minutes=1),
    )

    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    ReservationFactory.create(
        begin=begin - datetime.timedelta(hours=1),
        end=end - datetime.timedelta(hours=1),
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit],
        type=reservation_type,
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    if reservation_type == ReservationTypeChoice.BLOCKED:
        assert response.has_errors is False, response.errors
    else:
        assert response.error_message() == "Reservation overlaps with reservation before due to buffer time."


@pytest.mark.parametrize("reservation_type", [ReservationTypeChoice.BLOCKED, ReservationTypeChoice.NORMAL])
def test_reservation__create__reservation_unit_buffer_time_overlaps_with_reservation_after(graphql, reservation_type):
    reservation_unit = ReservationUnitFactory.create_reservable_now(
        buffer_time_after=datetime.timedelta(minutes=1),
    )

    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    ReservationFactory.create(
        begin=begin + datetime.timedelta(hours=1),
        end=end + datetime.timedelta(hours=1),
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit],
        type=reservation_type,
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    if reservation_type == ReservationTypeChoice.BLOCKED:
        assert response.has_errors is False, response.errors
    else:
        assert response.error_message() == "Reservation overlaps with reservation after due to buffer time."


def test_reservation__create__reservation_unit_closed(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation unit is not open within desired reservation time."


def test_reservation__create__reservation_unit_closed__allow_reservations_without_opening_hours(graphql):
    reservation_unit = ReservationUnitFactory.create(allow_reservations_without_opening_hours=True)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__create__reservation_unit_in_open_application_round(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()
    ApplicationRoundFactory.create_in_status_open(reservation_units=[reservation_unit])

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "One or more reservation units are in open application round."


def test_reservation__create__reservation_unit_max_reservation_duration_exceeded(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(
        max_reservation_duration=datetime.timedelta(minutes=30),
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation duration exceeds one or more reservation unit's maximum duration."


def test_reservation__create__reservation_unit_min_reservation_duration_subceeded(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(
        min_reservation_duration=datetime.timedelta(hours=3),
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation duration less than one or more reservation unit's minimum duration."


def test_reservation__create__start_time_does_not_match_reservation_start_interval(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1, minutes=1)  # NOTE! 1 minute after the next hour
    end = begin + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation start time does not match the allowed interval of 15 minutes."


def test_reservation__create__start_interval_error__allow_reservations_without_opening_hours(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(allow_reservations_without_opening_hours=True)

    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1, minutes=1)  # NOTE! 1 minute after the next hour
    end = begin + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__create__reservation_unit_is_archived(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(is_archived=True)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation unit is not reservable due to its status: 'ARCHIVED'."


def test_reservation__create__reservation_unit_is_draft(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(is_draft=True)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation unit is not reservable due to its status: 'DRAFT'."


def test_reservation__create__reservation_unit_reservation_begin_in_past(graphql):
    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    reservation_unit = ReservationUnitFactory.create_reservable_now(
        reservation_begins=next_hour - datetime.timedelta(days=10),
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__create__reservation_unit_reservation_begins_in_the_future(graphql):
    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    reservation_unit = ReservationUnitFactory.create_reservable_now(
        reservation_begins=next_hour + datetime.timedelta(days=10),
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation unit is not reservable at current time."


def test_reservation__create__reservation_unit_reservation_ends_in_the_past(graphql):
    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    reservation_unit = ReservationUnitFactory.create_reservable_now(
        reservation_ends=next_hour - datetime.timedelta(days=10),
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation unit is not reservable at current time."


def test_reservation__create__reservation_unit_reservation_end_in_future(graphql):
    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    reservation_unit = ReservationUnitFactory.create_reservable_now(
        reservation_ends=next_hour + datetime.timedelta(days=10),
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__create__reservation_unit_publish_begins_in_the_future(graphql):
    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    reservation_unit = ReservationUnitFactory.create_reservable_now(
        publish_begins=next_hour + datetime.timedelta(days=10),
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation unit is not reservable at current time."


def test_reservation__create__reservation_unit_publish_ends_in_the_past(graphql):
    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    reservation_unit = ReservationUnitFactory.create_reservable_now(
        publish_ends=next_hour - datetime.timedelta(days=10),
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation unit is not reservable at current time."


def test_reservation__create__not_logged_in(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to create."


def test_reservation__create__under_max_reservations_per_user(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(max_reservations_per_user=1)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert Reservation.objects.count() == 1


def test_reservation__create__over_max_reservations_per_user(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(max_reservations_per_user=1)

    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    user = graphql.login_with_superuser()
    ReservationFactory.create(
        begin=begin + datetime.timedelta(hours=2),
        end=end + datetime.timedelta(hours=2),
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit],
        user=user,
    )

    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Maximum number of active reservations for this reservation unit exceeded."


def test_reservation__create__max_reservations_per_user__past_reservations(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(max_reservations_per_user=1)

    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    user = graphql.login_with_superuser()
    ReservationFactory.create(
        begin=begin - datetime.timedelta(hours=3),
        end=end - datetime.timedelta(hours=3),
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit],
        user=user,
    )

    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.state == ReservationStateChoice.CREATED

    assert Reservation.objects.count() == 2


def test_reservation__create__max_reservations_per_user__reservations_for_other_reservation_units(graphql):
    reservation_unit_1 = ReservationUnitFactory.create_reservable_now(max_reservations_per_user=1)
    reservation_unit_2 = ReservationUnitFactory.create()

    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    user = graphql.login_with_superuser()
    ReservationFactory.create(
        begin=begin + datetime.timedelta(hours=2),
        end=end + datetime.timedelta(hours=2),
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit_2],
        user=user,
    )

    data = get_create_data(reservation_unit_1)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.state == ReservationStateChoice.CREATED

    assert Reservation.objects.count() == 2


def test_reservation__create__copy_sku_to_reservation(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(sku="foo")

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.sku == "foo"


def test_reservation__create__sku_is_ambiguous(graphql):
    reservation_unit_1 = ReservationUnitFactory.create_reservable_now(sku="foo")
    reservation_unit_2 = ReservationUnitFactory.create(sku="bar")

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit_1, reservationUnitPks=[reservation_unit_1.pk, reservation_unit_2.pk])
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "An ambiguous SKU cannot be assigned for this reservation."


def test_reservation__create__reservation_unit_reservations_max_days_before__exceeded(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(reservations_max_days_before=1)

    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(days=1, hours=1)
    end = begin + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation start time is earlier than 1 days before."


def test_reservation__create__reservation_unit_reservations_max_days_before__in_limits(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(reservations_max_days_before=1)

    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__create__reservation_unit_reservations_min_days_before__subceeded(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(reservations_min_days_before=1)

    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation start time is less than 1 days before."


def test_reservation__create__reservation_unit_reservations_min_days_before__in_limits(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(reservations_min_days_before=1)

    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(days=1, hours=1)
    end = begin + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__create__reservation_unit_reservation_kind_is_season(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(reservation_kind=ReservationKind.SEASON)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation unit is only available or seasonal booking."


def test_reservation__create__reservation_type__staff(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, type=ReservationTypeChoice.STAFF)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.type == ReservationTypeChoice.STAFF


def test_reservation__create__reservation_type__blocked(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, type=ReservationTypeChoice.BLOCKED)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.type == ReservationTypeChoice.BLOCKED


def test_reservation__create__reservation_type_provided_without_permissions(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    graphql.login_with_regular_user()
    data = get_create_data(reservation_unit, type=ReservationTypeChoice.BLOCKED)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "You don't have permissions to set type"


def test_reservation__create__price_calculation__free_reservation_unit(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])

    assert reservation.price == 0  # Free units should always be 0 €
    assert reservation.non_subsidised_price == reservation.price  # Non subsidised price be the same as price
    assert reservation.price_net == 0
    assert reservation.non_subsidised_price_net == reservation.price_net
    assert reservation.unit_price == 0
    assert reservation.tax_percentage_value == 0


def test_reservation__create__price_calculation__fixed_price_reservation_unit(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()
    pricing = ReservationUnitPricingFactory.create(
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        reservation_unit=reservation_unit,
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])

    price = pricing.highest_price
    price_net = round_decimal(price / pricing.tax_percentage.multiplier, 6)

    assert reservation.price == price  # With fixed price unit, time is ignored
    assert reservation.non_subsidised_price == price
    assert reservation.unit_price == price
    assert reservation.price_net == price_net
    assert reservation.non_subsidised_price_net == price_net
    assert reservation.tax_percentage_value == pricing.tax_percentage.value


def test_reservation__create__price_calculation__time_based_price(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()
    pricing = ReservationUnitPricingFactory.create(
        price_unit=PriceUnit.PRICE_UNIT_PER_15_MINS,
        reservation_unit=reservation_unit,
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])

    price = pricing.highest_price * 4  # 1h reservation, i.e. 4 x 15 min
    price_net = round_decimal(price / pricing.tax_percentage.multiplier, 6)

    assert reservation is not None
    assert reservation.price == price
    assert reservation.non_subsidised_price == price
    assert reservation.price_net == price_net
    assert reservation.non_subsidised_price_net == price_net
    assert reservation.unit_price == pricing.highest_price
    assert reservation.tax_percentage_value == pricing.tax_percentage.value


def test_reservation__create__price_calculation__multiple_reservation_units(graphql):
    reservation_unit_1 = ReservationUnitFactory.create_reservable_now(sku="foo")
    pricing_1 = ReservationUnitPricingFactory.create(
        price_unit=PriceUnit.PRICE_UNIT_PER_15_MINS,
        reservation_unit=reservation_unit_1,
        highest_price=Decimal("6.00"),
    )

    reservation_unit_2 = ReservationUnitFactory.create_reservable_now(sku="foo")
    pricing_2 = ReservationUnitPricingFactory.create(
        price_unit=PriceUnit.PRICE_UNIT_PER_15_MINS,
        reservation_unit=reservation_unit_2,
        highest_price=Decimal("10.00"),
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit_1, reservationUnitPks=[reservation_unit_1.pk, reservation_unit_2.pk])
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])

    price = pricing_1.highest_price * 4 + pricing_2.highest_price * 4  # 1h reservation = 4 x 15 min from both units
    price_net = round_decimal(price / pricing_1.tax_percentage.multiplier, 6)

    assert reservation.price == price
    assert reservation.non_subsidised_price == price
    assert reservation.price_net == price_net
    assert reservation.non_subsidised_price_net == price_net
    assert reservation.unit_price == pricing_1.highest_price  # always from the first unit
    assert reservation.tax_percentage_value == pricing_1.tax_percentage.value  # always from the first unit


def test_reservation__create__price_calculation__future_pricing(graphql):
    reservation_unit = ReservationUnitFactory.create(allow_reservations_without_opening_hours=True)

    now = local_datetime()

    # Current pricing
    ReservationUnitPricingFactory.create(
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        highest_price=Decimal("6"),
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        reservation_unit=reservation_unit,
    )

    future_pricing = ReservationUnitPricingFactory(
        begins=now + datetime.timedelta(days=1),
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        highest_price=Decimal("10"),
        status=PricingStatus.PRICING_STATUS_FUTURE,
        reservation_unit=reservation_unit,
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=now + datetime.timedelta(days=1, hours=1))
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])

    price = future_pricing.highest_price
    price_net = round_decimal(price / future_pricing.tax_percentage.multiplier, 6)

    assert reservation.price == price
    assert reservation.non_subsidised_price == price
    assert reservation.price_net == price_net
    assert reservation.non_subsidised_price_net == price_net
    assert reservation.unit_price == future_pricing.highest_price
    assert reservation.tax_percentage_value == future_pricing.tax_percentage.value


def test_reservation__create__duration_is_not_multiple_of_interval(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    now = local_datetime()
    next_hour = now.replace(minute=0, second=0, microsecond=0) + datetime.timedelta(hours=1)
    begin = next_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1, minutes=1)

    graphql.login_with_superuser()
    input_data = get_create_data(reservation_unit, begin=begin, end=end)

    response = graphql(CREATE_MUTATION, input_data=input_data)

    assert response.error_message() == "Reservation duration is not a multiple of the allowed interval of 15 minutes."


@pytest.mark.parametrize("arm", ["suomi_fi", "heltunnistussuomifi"])
def test_reservation__create__prefill_profile_data(graphql, settings, arm):
    # given:
    # - Prefill setting is on
    # - There is a reservation unit in the system
    # - The reservation unit has reservable time span
    # - There is a city in the system
    # - A regular user who has logged in with Suomi.fi is using the system
    settings.PREFILL_RESERVATION_WITH_PROFILE_DATA = True

    reservation_unit = ReservationUnitFactory.create_reservable_now()
    CityFactory.create(name="Helsinki")
    user = UserFactory.create(social_auth__extra_data__amr=arm)
    graphql.force_login(user)

    # when:
    # - The user tries to create a reservation
    data = get_create_data(reservation_unit)
    with mock_profile_reader():
        response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - There are no errors in the response
    # - The reservation is prefilled from the users profile data
    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])

    # Check that the reservation has been prefilled with the profile data
    assert reservation.reservee_first_name == "John"
    assert reservation.reservee_last_name == "Doe"
    assert reservation.reservee_address_city == "Helsinki"
    assert reservation.reservee_address_street == "Test street 1"
    assert reservation.reservee_address_zip == "00100"
    assert reservation.home_city.name == "Helsinki"


def test_create_reservation__prefilled_with_profile_data__missing(graphql, settings):
    # given:
    # - Prefill setting is on
    # - There is a reservation unit in the system
    # - There is a city in the system
    # - A regular user who has logged in with Suomi.fi is using the system
    settings.PREFILL_RESERVATION_WITH_PROFILE_DATA = True

    reservation_unit = ReservationUnitFactory.create_reservable_now()
    CityFactory.create(name="Helsinki")
    user = UserFactory.create(social_auth__extra_data__amr="suomi_fi")
    graphql.force_login(user)

    # when:
    # - The user tries to create a reservation, but the profile data is missing
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - There are no errors in the response
    # - The reservation was not prefilled from the users profile data
    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.reservee_first_name == ""
    assert reservation.reservee_last_name == ""
    assert reservation.reservee_address_city == ""
    assert reservation.reservee_address_street == ""
    assert reservation.reservee_address_zip == ""
    assert reservation.home_city is None


@pytest.mark.parametrize("arm", ADLoginAMR)
def test_create_reservation__prefilled_with_profile_data__ad_login(graphql, settings, arm: ADLoginAMR):
    # given:
    # - Prefill setting is on
    # - There is a reservation unit in the system
    # - There is a city in the system
    # - A regular user who has logged in with Azure AD is using the system
    settings.PREFILL_RESERVATION_WITH_PROFILE_DATA = True

    reservation_unit = ReservationUnitFactory.create_reservable_now()
    CityFactory.create(name="Helsinki")
    user = UserFactory.create(social_auth__extra_data__amr=arm.value)
    graphql.force_login(user)

    # when:
    # - The user tries to create a reservation
    data = get_create_data(reservation_unit)
    with mock_profile_reader():
        response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - There are no errors in the response
    # - The reservation was not prefilled from the users profile data
    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.reservee_first_name == ""
    assert reservation.reservee_last_name == ""
    assert reservation.reservee_address_city == ""
    assert reservation.reservee_address_street == ""
    assert reservation.reservee_address_zip == ""
    assert reservation.home_city is None


@freezegun.freeze_time("2021-01-01")
def test_create_reservation__reservation_block_whole_day(graphql):
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

    graphql.login_user_based_on_type(UserType.REGULAR)

    input_data = {
        "name": "foo",
        "description": "bar",
        "begin": datetime.datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime.datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
    }

    response = graphql(CREATE_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime.datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime.datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == datetime.timedelta(hours=12)
    assert reservation.buffer_time_after == datetime.timedelta(hours=11)


@freezegun.freeze_time("2021-01-01")
def test_create_reservation__reservation_block_whole_day__midnight(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime.datetime(2022, 12, 31, 0, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2023, 1, 3, 0, tzinfo=DEFAULT_TIMEZONE),
    )

    graphql.login_user_based_on_type(UserType.REGULAR)

    input_data = {
        "name": "foo",
        "description": "bar",
        "begin": datetime.datetime(2023, 1, 1, hour=0, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime.datetime(2023, 1, 2, hour=0, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
    }

    response = graphql(CREATE_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime.datetime(2023, 1, 1, hour=0, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime.datetime(2023, 1, 2, hour=0, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == datetime.timedelta(hours=0)
    assert reservation.buffer_time_after == datetime.timedelta(hours=0)


@freezegun.freeze_time("2021-01-01")
def test_create_reservation__reservation_block_whole_day__previous_reservation_blocks(graphql):
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

    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begin=datetime.datetime(2023, 1, 1, 8, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2023, 1, 1, 9, tzinfo=DEFAULT_TIMEZONE),
    )

    graphql.login_user_based_on_type(UserType.REGULAR)

    input_data = {
        "name": "foo",
        "description": "bar",
        "begin": datetime.datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime.datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
    }

    response = graphql(CREATE_MUTATION, input_data=input_data)
    assert response.error_message() == "Reservation overlaps with reservation before due to buffer time."


@freezegun.freeze_time("2021-01-01")
def test_create_reservation__reservation_block_whole_day__next_reservation_blocks(graphql):
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

    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begin=datetime.datetime(2023, 1, 1, 16, tzinfo=DEFAULT_TIMEZONE),
        end=datetime.datetime(2023, 1, 1, 17, tzinfo=DEFAULT_TIMEZONE),
    )

    graphql.login_user_based_on_type(UserType.REGULAR)

    input_data = {
        "name": "foo",
        "description": "bar",
        "begin": datetime.datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime.datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
    }

    response = graphql(CREATE_MUTATION, input_data=input_data)
    assert response.error_message() == "Reservation overlaps with reservation after due to buffer time."
