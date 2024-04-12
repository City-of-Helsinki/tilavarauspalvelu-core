from datetime import datetime, timedelta
from decimal import Decimal
from typing import NamedTuple

import freezegun
import pytest
from django.utils.timezone import get_default_timezone
from graphene_django_extensions.testing import parametrize_helper

from common.date_utils import local_datetime, local_end_of_day, local_start_of_day
from reservation_units.enums import PriceUnit, PricingStatus, ReservationKind
from reservation_units.models import ReservationUnit
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
from tests.helpers import ResponseMock, UserType, next_hour, patch_method
from users.helauth.clients import HelsinkiProfileClient
from users.helauth.typing import ADLoginAMR
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
        buffer_time_before=timedelta(),
        buffer_time_after=timedelta(),
    )
    reservation_unit_2 = ReservationUnitFactory.create_reservable_now(
        sku="foo",
        buffer_time_before=timedelta(minutes=90),
        buffer_time_after=timedelta(),
    )
    reservation_unit_3 = ReservationUnitFactory.create_reservable_now(
        sku="foo",
        buffer_time_before=timedelta(),
        buffer_time_after=timedelta(minutes=15),
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

    begin = next_hour(1)
    end = begin + timedelta(hours=1)

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


class BufferParams(NamedTuple):
    reservation_delta_time: timedelta
    error_message: str
    reservation_buffer_before: timedelta = timedelta()
    reservation_buffer_after: timedelta = timedelta()
    reservation_unit_buffer_before: timedelta = timedelta()
    reservation_unit_buffer_after: timedelta = timedelta()


@pytest.mark.parametrize("reservation_type", [ReservationTypeChoice.BLOCKED, ReservationTypeChoice.NORMAL])
@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Reservation Buffer Before": BufferParams(
                reservation_delta_time=-timedelta(hours=1),
                reservation_unit_buffer_before=timedelta(minutes=1),
                error_message="Reservation overlaps with reservation before due to buffer time.",
            ),
            "Reservation Buffer After": BufferParams(
                reservation_delta_time=timedelta(hours=1),
                reservation_unit_buffer_after=timedelta(minutes=1),
                error_message="Reservation overlaps with reservation after due to buffer time.",
            ),
            "Reservation Unit Buffer Before": BufferParams(
                reservation_delta_time=-timedelta(hours=1),
                reservation_unit_buffer_before=timedelta(minutes=1),
                error_message="Reservation overlaps with reservation before due to buffer time.",
            ),
            "Reservation Unit Buffer After": BufferParams(
                reservation_delta_time=timedelta(hours=1),
                reservation_unit_buffer_after=timedelta(minutes=1),
                error_message="Reservation overlaps with reservation after due to buffer time.",
            ),
        }
    )
)
def test_reservation__create__overlaps_with_reservation_buffer_before_or_after(
    graphql,
    reservation_type,
    error_message,
    reservation_delta_time,
    reservation_buffer_before,
    reservation_buffer_after,
    reservation_unit_buffer_before,
    reservation_unit_buffer_after,
):
    reservation_unit = ReservationUnitFactory.create_reservable_now(
        buffer_time_before=reservation_unit_buffer_before,
        buffer_time_after=reservation_unit_buffer_after,
    )

    begin = next_hour(1)
    end = begin + timedelta(hours=1)

    ReservationFactory.create(
        begin=begin + reservation_delta_time,
        end=end + reservation_delta_time,
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit],
        buffer_time_before=reservation_buffer_before,
        buffer_time_after=reservation_buffer_after,
        type=reservation_type,
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    if reservation_type == ReservationTypeChoice.BLOCKED:
        assert response.has_errors is False, response.errors
    else:
        assert response.error_message() == error_message


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
        max_reservation_duration=timedelta(minutes=30),
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation duration exceeds one or more reservation unit's maximum duration."


def test_reservation__create__reservation_unit_min_reservation_duration_subceeded(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(
        min_reservation_duration=timedelta(hours=3),
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation duration less than one or more reservation unit's minimum duration."


@pytest.mark.parametrize("allow_reservations_without_opening_hours", [True, False])
def test_reservation__create__start_time_does_not_match_reservation_start_interval(
    graphql,
    allow_reservations_without_opening_hours,
):
    reservation_unit = ReservationUnitFactory.create_reservable_now(
        allow_reservations_without_opening_hours=allow_reservations_without_opening_hours
    )

    begin = next_hour(1, plus_minutes=1)  # NOTE! 1 minute after the next hour
    end = begin + timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    if allow_reservations_without_opening_hours:
        # Reservation should be allowed regardless of if the start time matches the interval
        assert response.has_errors is False, response.errors
        reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
        assert reservation.state == ReservationStateChoice.CREATED
    else:
        assert response.error_message() == "Reservation start time does not match the allowed interval of 15 minutes."


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


class ReservationTimeParams(NamedTuple):
    reservation_begins_delta: int = 0
    reservation_ends_delta: int = 0
    publish_begins_delta: int = 0
    publish_ends_delta: int = 0
    is_error: bool = False


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Reservation began in the past": ReservationTimeParams(reservation_begins_delta=-10),
            "Reservation begins in the future": ReservationTimeParams(reservation_begins_delta=10, is_error=True),
            "Reservation ended in the past": ReservationTimeParams(reservation_ends_delta=-10, is_error=True),
            "Reservation ends in the future": ReservationTimeParams(reservation_ends_delta=10),
            "Publish began in the past": ReservationTimeParams(publish_begins_delta=-10),
            "Publish begins in the future": ReservationTimeParams(publish_begins_delta=10, is_error=True),
            "Publish ended in the past": ReservationTimeParams(publish_ends_delta=-10, is_error=True),
            "Publish ends in the future": ReservationTimeParams(publish_ends_delta=10),
        }
    )
)
def test_reservation__create__reservation_unit_reservation_and_publish_in_the_past_or_future(
    graphql,
    reservation_begins_delta,
    reservation_ends_delta,
    publish_begins_delta,
    publish_ends_delta,
    is_error,
):
    begin = next_hour(1)
    end = begin + timedelta(hours=1)

    reservation_unit = ReservationUnitFactory.create_reservable_now(
        reservation_begins=next_hour(plus_days=reservation_begins_delta) if reservation_begins_delta else None,
        reservation_ends=next_hour(plus_days=reservation_ends_delta) if reservation_ends_delta else None,
        publish_begins=next_hour(plus_days=publish_begins_delta) if publish_begins_delta else None,
        publish_ends=next_hour(plus_days=publish_ends_delta) if publish_ends_delta else None,
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    if is_error:
        assert response.error_message() == "Reservation unit is not reservable at current time."
    else:
        assert response.has_errors is False, response.errors
        reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
        assert reservation.state == ReservationStateChoice.CREATED


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

    begin = next_hour(1)
    end = begin + timedelta(hours=1)

    user = graphql.login_with_superuser()
    ReservationFactory.create(
        begin=begin,
        end=end,
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit],
        user=user,
    )

    data = get_create_data(reservation_unit, begin=begin + timedelta(hours=1), end=end + timedelta(hours=1))
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Maximum number of active reservations for this reservation unit exceeded."


def test_reservation__create__max_reservations_per_user__past_reservations(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(max_reservations_per_user=1)

    begin = next_hour(1)
    end = begin + timedelta(hours=1)

    user = graphql.login_with_superuser()
    ReservationFactory.create(
        begin=begin - timedelta(hours=3),
        end=end - timedelta(hours=3),
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit],
        user=user,
    )

    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.state == ReservationStateChoice.CREATED

    assert Reservation.objects.count() == 2


def test_reservation__create__max_reservations_per_user__reservations_for_other_unrelated_reservation_units(graphql):
    reservation_unit_1 = ReservationUnitFactory.create_reservable_now(max_reservations_per_user=1)
    reservation_unit_2 = ReservationUnitFactory.create()

    begin = next_hour(1)
    end = begin + timedelta(hours=1)

    user = graphql.login_with_superuser()
    ReservationFactory.create(
        begin=begin,
        end=end,
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit_2],
        user=user,
    )

    data = get_create_data(reservation_unit_1, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.state == ReservationStateChoice.CREATED

    assert Reservation.objects.count() == 2


def test_reservation__create__max_reservations_per_user__reservations_for_other_related_reservation_units(graphql):
    """Reservations in the same hierarchy should NOT be counted towards the max_reservations_per_user limit."""
    reservation_unit_1: ReservationUnit = ReservationUnitFactory.create_reservable_now(
        max_reservations_per_user=1,
        spaces=[SpaceFactory.create()],
    )
    reservation_unit_2: ReservationUnit = ReservationUnitFactory.create(
        max_reservations_per_user=1,
        unit=reservation_unit_1.unit,  # In the same hierarchy as reservation_unit_1
        spaces=reservation_unit_1.spaces.all(),
    )

    begin = next_hour(1)
    end = begin + timedelta(hours=1)

    user = graphql.login_with_superuser()
    ReservationFactory.create(
        begin=begin + timedelta(hours=1),
        end=end + timedelta(hours=1),
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit=[reservation_unit_2],
        user=user,
    )

    data = get_create_data(reservation_unit_1, begin=begin, end=end)
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


class ReservationsMinMaxDaysParams(NamedTuple):
    reservation_days_delta: int
    reservations_max_days_before: int | None = None
    reservations_min_days_before: int | None = None
    error_message: str | None = None


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Max days before exceeded": ReservationsMinMaxDaysParams(
                reservation_days_delta=1,
                reservations_max_days_before=1,
                error_message="Reservation start time is earlier than 1 days before.",
            ),
            "Max days before in limits": ReservationsMinMaxDaysParams(
                reservation_days_delta=0,
                reservations_max_days_before=1,
                error_message=None,
            ),
            "Min days before in limits": ReservationsMinMaxDaysParams(
                reservation_days_delta=1,
                reservations_min_days_before=1,
                error_message=None,
            ),
            "Min days before subceeded": ReservationsMinMaxDaysParams(
                reservation_days_delta=0,
                reservations_min_days_before=1,
                error_message="Reservation start time is less than 1 days before.",
            ),
        }
    )
)
def test_reservation__create__reservation_unit_reservations_min_and_max_days_before_and_after(
    graphql,
    reservation_days_delta,
    reservations_max_days_before,
    reservations_min_days_before,
    error_message,
):
    reservation_unit = ReservationUnitFactory.create_reservable_now(
        reservations_max_days_before=reservations_max_days_before,
        reservations_min_days_before=reservations_min_days_before,
    )

    begin = next_hour(1, plus_days=reservation_days_delta)
    end = next_hour(2, plus_days=reservation_days_delta)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    if error_message:
        assert response.error_message() == error_message
    else:
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
        begins=now + timedelta(days=1),
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        highest_price=Decimal("10"),
        status=PricingStatus.PRICING_STATUS_FUTURE,
        reservation_unit=reservation_unit,
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=now + timedelta(days=1, hours=1))
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

    begin = next_hour(1)
    end = next_hour(2, plus_minutes=1)

    graphql.login_with_superuser()
    input_data = get_create_data(reservation_unit, begin=begin, end=end)

    response = graphql(CREATE_MUTATION, input_data=input_data)

    assert response.error_message() == "Reservation duration is not a multiple of the allowed interval of 15 minutes."


@pytest.mark.parametrize("arm", ["suomi_fi", "heltunnistussuomifi"])
def test_reservation__create__prefill_profile_data(graphql, settings, arm):
    # given:
    # - Prefill setting is on
    # - There is a reservation unit in the system
    # - The reservation unit has a reservable time span
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
    assert reservation.reservee_first_name == "Example"
    assert reservation.reservee_last_name == "User"
    assert reservation.reservee_email == "user@example.com"
    assert reservation.reservee_phone == "0123456789"
    assert reservation.reservee_address_street == "Example street 1"
    assert reservation.reservee_address_zip == "00100"
    assert reservation.reservee_address_city == "Helsinki"
    assert reservation.home_city.name == "Helsinki"


@patch_method(HelsinkiProfileClient.generic, return_value=ResponseMock(status_code=500, json_data={}))
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_reservation__create__prefilled_with_profile_data__api_call_fails(graphql, settings):
    # given:
    # - Prefill setting is on
    # - There is a reservation unit in the system
    # - The reservation unit has a reservable time span
    # - There is a city in the system
    # - A regular user who has logged in with Suomi.fi is using the system
    settings.PREFILL_RESERVATION_WITH_PROFILE_DATA = True

    reservation_unit = ReservationUnitFactory.create_reservable_now()
    CityFactory.create(name="Helsinki")
    user = UserFactory.create(social_auth__extra_data__amr="suomi_fi")
    graphql.force_login(user)

    # when:
    # - The user tries to create a reservation, but the helsinki profile call fails.
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
def test_reservation__create__prefilled_with_profile_data__ad_login(graphql, settings, arm: ADLoginAMR):
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
def test_reservation__create__reservation_block_whole_day__non_reserved_time_is_filled_by_buffers(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime(2023, 1, 1, 6, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )

    graphql.login_user_based_on_type(UserType.REGULAR)

    input_data = {
        "name": "foo",
        "description": "bar",
        "begin": datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
    }

    response = graphql(CREATE_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == timedelta(hours=12)
    assert reservation.buffer_time_after == timedelta(hours=11)


@freezegun.freeze_time("2021-01-01")
def test_reservation__create__reservation_block_whole_day__start_and_end_at_midnight_has_no_buffers(graphql):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=datetime(2022, 12, 31, 0, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime(2023, 1, 3, 0, tzinfo=DEFAULT_TIMEZONE),
    )

    graphql.login_user_based_on_type(UserType.REGULAR)

    input_data = {
        "name": "foo",
        "description": "bar",
        "begin": datetime(2023, 1, 1, hour=0, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime(2023, 1, 2, hour=0, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
    }

    response = graphql(CREATE_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation | None = Reservation.objects.filter(name="foo").first()
    assert reservation is not None
    assert reservation.begin == datetime(2023, 1, 1, hour=0, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime(2023, 1, 2, hour=0, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == timedelta(hours=0)
    assert reservation.buffer_time_after == timedelta(hours=0)


@freezegun.freeze_time("2021-01-01 12:00")
@pytest.mark.parametrize(
    ("new_reservation_begin_delta", "error_message"),
    [
        (timedelta(hours=-3), "Reservation overlaps with reservation after due to buffer time."),
        (timedelta(hours=3), "Reservation overlaps with reservation before due to buffer time."),
    ],
)
def test_reservation__create__reservation_block_whole_day__blocks_reserving_for_new_reservation(
    graphql,
    new_reservation_begin_delta,
    error_message,
):
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=OriginHaukiResourceFactory(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
    )

    begin = next_hour(1)
    end = begin + timedelta(hours=1)

    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=local_start_of_day(begin),
        end_datetime=local_end_of_day(begin),
    )

    ReservationFactory.create_for_reservation_unit(reservation_unit=reservation_unit, begin=begin, end=end)

    graphql.login_user_based_on_type(UserType.REGULAR)

    input_data = {
        "name": "foo",
        "description": "bar",
        "begin": (begin + new_reservation_begin_delta).isoformat(),
        "end": (end + new_reservation_begin_delta).isoformat(),
        "reservationUnitPks": [reservation_unit.pk],
    }

    response = graphql(CREATE_MUTATION, input_data=input_data)
    assert response.error_message() == error_message
