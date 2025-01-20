from __future__ import annotations

import datetime
import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, NamedTuple

import freezegun
import pytest
from freezegun import freeze_time
from graphene_django_extensions.testing import parametrize_helper

from tilavarauspalvelu.enums import (
    ADLoginAMR,
    PaymentType,
    PriceUnit,
    ReservationKind,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation, ReservationUnitHierarchy
from utils.date_utils import DEFAULT_TIMEZONE, local_date, local_datetime, next_hour

from tests.factories import (
    ApplicationRoundFactory,
    CityFactory,
    OriginHaukiResourceFactory,
    ReservationFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
    SpaceFactory,
    UserFactory,
)
from tests.helpers import ResponseMock, patch_method

from .helpers import CREATE_MUTATION, get_create_data, mock_profile_reader

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation__create__success(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert Reservation.objects.count() == 1


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

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    # An overlapping reservation
    ReservationFactory.create(
        begin=begin,
        end=end,
        state=ReservationStateChoice.CONFIRMED,
        reservation_units=[reservation_unit],
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)

    ReservationUnitHierarchy.refresh()

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.field_error_messages() == ["Reservation overlaps with existing reservations."]


class BufferParams(NamedTuple):
    reservation_delta_time: datetime.timedelta
    buffer_before: datetime.timedelta = datetime.timedelta()
    buffer_after: datetime.timedelta = datetime.timedelta()


@pytest.mark.parametrize("reservation_type", [ReservationTypeChoice.BLOCKED, ReservationTypeChoice.NORMAL])
@pytest.mark.parametrize(
    **parametrize_helper({
        "Reservation Buffer Before": BufferParams(
            reservation_delta_time=-datetime.timedelta(hours=1),
            buffer_before=datetime.timedelta(minutes=1),
        ),
        "Reservation Buffer After": BufferParams(
            reservation_delta_time=datetime.timedelta(hours=1),
            buffer_after=datetime.timedelta(minutes=1),
        ),
        "Reservation Unit Buffer Before": BufferParams(
            reservation_delta_time=-datetime.timedelta(hours=1),
            buffer_before=datetime.timedelta(minutes=1),
        ),
        "Reservation Unit Buffer After": BufferParams(
            reservation_delta_time=datetime.timedelta(hours=1),
            buffer_after=datetime.timedelta(minutes=1),
        ),
    })
)
def test_reservation__create__overlaps_with_reservation_buffer_before_or_after(
    graphql,
    reservation_type,
    reservation_delta_time,
    buffer_before,
    buffer_after,
):
    reservation_unit = ReservationUnitFactory.create_reservable_now(
        buffer_time_before=buffer_before,
        buffer_time_after=buffer_after,
    )

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    ReservationFactory.create(
        begin=begin + reservation_delta_time,
        end=end + reservation_delta_time,
        state=ReservationStateChoice.CONFIRMED,
        reservation_units=[reservation_unit],
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        type=reservation_type,
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)

    ReservationUnitHierarchy.refresh()

    response = graphql(CREATE_MUTATION, input_data=data)

    if reservation_type == ReservationTypeChoice.BLOCKED:
        assert response.has_errors is False, response.errors
    else:
        assert response.field_error_messages() == ["Reservation overlaps with existing reservations."]


def test_reservation__create__reservation_unit_closed(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.field_error_messages() == ["Reservation unit is not open within desired reservation time."]


def test_reservation__create__reservation_unit_closed__allow_reservations_without_opening_hours(graphql):
    reservation_unit = ReservationUnitFactory.create(
        allow_reservations_without_opening_hours=True,
        pricings__lowest_price=0,
        pricings__highest_price=0,
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation: Reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__create__reservation_unit_in_open_application_round(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()
    ApplicationRoundFactory.create_in_status_open(reservation_units=[reservation_unit])

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.field_error_messages() == ["Reservation unit is in an open application round."]


def test_reservation__create__reservation_unit_max_reservation_duration_exceeded(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(
        max_reservation_duration=datetime.timedelta(minutes=30),
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.field_error_messages() == [
        "Reservation duration exceeds reservation unit's maximum allowed duration."
    ]


def test_reservation__create__reservation_unit_min_reservation_duration_subceeded(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(
        min_reservation_duration=datetime.timedelta(hours=3),
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.field_error_messages() == [
        "Reservation duration is less than the reservation unit's minimum allowed duration."
    ]


@pytest.mark.parametrize("allow_reservations_without_opening_hours", [True, False])
def test_reservation__create__start_time_does_not_match_reservation_start_interval(
    graphql,
    allow_reservations_without_opening_hours,
):
    reservation_unit = ReservationUnitFactory.create_reservable_now(
        allow_reservations_without_opening_hours=allow_reservations_without_opening_hours
    )

    begin = next_hour(plus_hours=1, plus_minutes=1)  # NOTE! 1 minute after the next hour
    end = begin + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    if allow_reservations_without_opening_hours:
        # Reservation should be allowed regardless of if the start time matches the interval
        assert response.has_errors is False, response.errors
        reservation: Reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
        assert reservation.state == ReservationStateChoice.CREATED
    else:
        assert response.field_error_messages() == [
            "Reservation start time does not match the reservation unit's allowed start interval."
        ]


def test_reservation__create__reservation_unit_is_archived(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(is_archived=True)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.field_error_messages() == ["Reservation unit is not currently published."]


def test_reservation__create__reservation_unit_is_draft(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(is_draft=True)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.field_error_messages() == ["Reservation unit is not currently published."]


class ReservationTimeParams(NamedTuple):
    reservation_begins_delta: int = 0
    reservation_ends_delta: int = 0
    is_error: bool = False


@pytest.mark.parametrize(
    **parametrize_helper({
        "Reservation began in the past": ReservationTimeParams(reservation_begins_delta=-10),
        "Reservation begins in the future": ReservationTimeParams(reservation_begins_delta=10, is_error=True),
        "Reservation ended in the past": ReservationTimeParams(reservation_ends_delta=-10, is_error=True),
        "Reservation ends in the future": ReservationTimeParams(reservation_ends_delta=10),
    })
)
def test_reservation__create__reservation_unit_reservation_in_the_past_or_future(
    graphql,
    reservation_begins_delta,
    reservation_ends_delta,
    is_error,
):
    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    reservation_unit = ReservationUnitFactory.create_reservable_now(
        reservation_begins=next_hour(plus_days=reservation_begins_delta) if reservation_begins_delta else None,
        reservation_ends=next_hour(plus_days=reservation_ends_delta) if reservation_ends_delta else None,
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    if is_error:
        assert response.field_error_messages() == [
            "Reservation unit is not reservable at the time of the reservation.",
        ]
    else:
        assert response.has_errors is False, response.errors
        reservation: Reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
        assert reservation.state == ReservationStateChoice.CREATED


class PublishTimeParams(NamedTuple):
    publish_begins_delta: int = 0
    publish_ends_delta: int = 0
    is_error: bool = False


@pytest.mark.parametrize(
    **parametrize_helper({
        "Publish began in the past": PublishTimeParams(publish_begins_delta=-10),
        "Publish begins in the future": PublishTimeParams(publish_begins_delta=10, is_error=True),
        "Publish ended in the past": PublishTimeParams(publish_ends_delta=-10, is_error=True),
        "Publish ends in the future": PublishTimeParams(publish_ends_delta=10),
    })
)
def test_reservation__create__reservation_unit_publish_in_the_past_or_future(
    graphql,
    publish_begins_delta,
    publish_ends_delta,
    is_error,
):
    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    reservation_unit = ReservationUnitFactory.create_reservable_now(
        publish_begins=next_hour(plus_days=publish_begins_delta) if publish_begins_delta else None,
        publish_ends=next_hour(plus_days=publish_ends_delta) if publish_ends_delta else None,
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    if is_error:
        assert response.field_error_messages() == [
            "Reservation unit is not currently published.",
        ]
    else:
        assert response.has_errors is False, response.errors
        reservation: Reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
        assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__create__not_logged_in(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to create."


def test_reservation__create__max_reservations_per_user__under(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(max_reservations_per_user=1)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert Reservation.objects.count() == 1


def test_reservation__create__max_reservations_per_user__over(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(max_reservations_per_user=1)

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    user = graphql.login_with_superuser()
    ReservationFactory.create(
        begin=begin,
        end=end,
        state=ReservationStateChoice.CONFIRMED,
        reservation_units=[reservation_unit],
        user=user,
    )

    data = get_create_data(
        reservation_unit,
        begin=begin + datetime.timedelta(hours=1),
        end=end + datetime.timedelta(hours=1),
    )
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.field_error_messages() == [
        "Maximum number of active reservations for this reservation unit exceeded."
    ]


def test_reservation__create__max_reservations_per_user__non_normal_reservation(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(max_reservations_per_user=1)

    begin = next_hour(plus_hours=3)
    end = begin + datetime.timedelta(hours=1)

    # Seasonal reservations don't count towards the `max_reservations_per_user` limit
    user = graphql.login_with_superuser()

    # Only NORMAL type choice should affect the count, all others should be ignored
    for type_choice in [
        ReservationTypeChoice.BLOCKED,
        ReservationTypeChoice.STAFF,
        ReservationTypeChoice.BEHALF,
        ReservationTypeChoice.SEASONAL,
    ]:
        ReservationFactory.create(
            begin=begin,
            end=end,
            state=ReservationStateChoice.CONFIRMED,
            reservation_units=[reservation_unit],
            user=user,
            type=type_choice,
        )

    data = get_create_data(reservation_unit)

    assert Reservation.objects.count() == 4

    response = graphql(CREATE_MUTATION, input_data=data)
    assert response.has_errors is False, response.errors

    assert Reservation.objects.count() == 5


def test_reservation__create__max_reservations_per_user__past_reservations(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(max_reservations_per_user=1)

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    user = graphql.login_with_superuser()
    ReservationFactory.create(
        begin=begin - datetime.timedelta(hours=3),
        end=end - datetime.timedelta(hours=3),
        state=ReservationStateChoice.CONFIRMED,
        reservation_units=[reservation_unit],
        user=user,
    )

    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation: Reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.state == ReservationStateChoice.CREATED

    assert Reservation.objects.count() == 2


def test_reservation__create__max_reservations_per_user__reservations_for_other_unrelated_reservation_units(graphql):
    reservation_unit_1 = ReservationUnitFactory.create_reservable_now(max_reservations_per_user=1)
    reservation_unit_2 = ReservationUnitFactory.create()

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    user = graphql.login_with_superuser()
    ReservationFactory.create(
        begin=begin,
        end=end,
        state=ReservationStateChoice.CONFIRMED,
        reservation_units=[reservation_unit_2],
        user=user,
    )

    data = get_create_data(reservation_unit_1, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation: Reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
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

    begin = next_hour(plus_hours=1)
    end = begin + datetime.timedelta(hours=1)

    user = graphql.login_with_superuser()
    ReservationFactory.create(
        begin=begin + datetime.timedelta(hours=1),
        end=end + datetime.timedelta(hours=1),
        state=ReservationStateChoice.CONFIRMED,
        reservation_units=[reservation_unit_2],
        user=user,
    )

    data = get_create_data(reservation_unit_1, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation: Reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
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


class ReservationsMinMaxDaysParams(NamedTuple):
    reservation_days_delta: int
    reservations_max_days_before: int | None = None
    reservations_min_days_before: int | None = None
    error_message: str | None = None


@pytest.mark.parametrize(
    **parametrize_helper({
        "Max days before exceeded": ReservationsMinMaxDaysParams(
            reservation_days_delta=2,
            reservations_max_days_before=2,
            error_message="Reservation start time is earlier than 2 days before.",
        ),
        "Max days before in limits": ReservationsMinMaxDaysParams(
            reservation_days_delta=0,
            reservations_max_days_before=2,
            error_message=None,
        ),
        "Min days before in limits": ReservationsMinMaxDaysParams(
            reservation_days_delta=2,
            reservations_min_days_before=2,
            error_message=None,
        ),
        "Min days before subceeded": ReservationsMinMaxDaysParams(
            reservation_days_delta=0,
            reservations_min_days_before=2,
            error_message="Reservation start time is later than 2 days before.",
        ),
    })
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

    begin = next_hour(plus_hours=1, plus_days=reservation_days_delta)
    end = next_hour(plus_hours=2, plus_days=reservation_days_delta)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=begin, end=end)
    response = graphql(CREATE_MUTATION, input_data=data)

    if error_message:
        assert response.has_errors is True, response
        assert response.field_error_messages() == [error_message]
    else:
        assert response.has_errors is False, response.errors
        reservation: Reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
        assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__create__reservation_unit_reservation_kind_is_season(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(reservation_kind=ReservationKind.SEASON)

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.field_error_messages() == ["Reservation unit is not direct bookable."]


def test_reservation__create__price_calculation__free_reservation_unit(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])

    assert reservation.price == 0  # Free units should always be 0 €
    assert reservation.non_subsidised_price == reservation.price  # Non subsidised price be the same as price
    assert reservation.unit_price == 0
    assert reservation.tax_percentage_value == 0


def test_reservation__create__price_calculation__fixed_price_reservation_unit(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(
        allow_reservations_without_opening_hours=True,
        pricings__lowest_price=Decimal(10),
        pricings__highest_price=Decimal(20),
        pricings__price_unit=PriceUnit.PRICE_UNIT_FIXED,
        pricings__tax_percentage__value=Decimal(10),
        payment_types__code=PaymentType.ONLINE,
        payment_product__id=uuid.uuid4(),
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)

    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation: Reservation = Reservation.objects.get(pk=response.first_query_object["pk"])

    assert reservation.price == Decimal(20)
    assert reservation.non_subsidised_price == Decimal(20)
    assert reservation.unit_price == Decimal(20)
    assert reservation.tax_percentage_value == Decimal(10)


def test_reservation__create__price_calculation__time_based_price(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(
        allow_reservations_without_opening_hours=True,
        pricings__lowest_price=Decimal(10),
        pricings__highest_price=Decimal(20),
        pricings__price_unit=PriceUnit.PRICE_UNIT_PER_15_MINS,
        pricings__tax_percentage__value=Decimal(10),
        payment_types__code=PaymentType.ONLINE,
        payment_product__id=uuid.uuid4(),
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    reservation: Reservation = Reservation.objects.get(pk=response.first_query_object["pk"])

    assert reservation.price == Decimal(80)
    assert reservation.non_subsidised_price == Decimal(80)
    assert reservation.unit_price == Decimal(20)
    assert reservation.tax_percentage_value == Decimal(10)


def test_reservation__create__price_calculation__future_pricing(graphql):
    now = local_datetime()

    reservation_unit = ReservationUnitFactory.create_reservable_now(
        allow_reservations_without_opening_hours=True,
        payment_types__code=PaymentType.ONLINE,
        payment_product__id=uuid.uuid4(),
        # Current pricing
        pricings__begins=now,
        pricings__price_unit=PriceUnit.PRICE_UNIT_FIXED,
        pricings__lowest_price=Decimal(5),
        pricings__highest_price=Decimal(6),
        pricings__tax_percentage__value=Decimal(24),
    )
    # Future pricing
    ReservationUnitPricingFactory.create(
        begins=now + datetime.timedelta(days=1),
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        lowest_price=Decimal(5),
        highest_price=Decimal(10),
        tax_percentage__value=Decimal(24),
        reservation_unit=reservation_unit,
    )

    graphql.login_with_superuser()
    data = get_create_data(reservation_unit, begin=now + datetime.timedelta(days=1, hours=1))
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation: Reservation = Reservation.objects.get(pk=response.first_query_object["pk"])

    assert reservation.price == Decimal(10)
    assert reservation.non_subsidised_price == Decimal(10)
    assert reservation.unit_price == Decimal(10)
    assert reservation.tax_percentage_value == Decimal(24)


def test_reservation__create__duration_is_not_multiple_of_interval(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now()

    begin = next_hour(plus_hours=1)
    end = next_hour(plus_hours=2, plus_minutes=1)

    graphql.login_with_superuser()
    input_data = get_create_data(reservation_unit, begin=begin, end=end)

    response = graphql(CREATE_MUTATION, input_data=input_data)

    assert response.field_error_messages() == [
        "Reservation duration is not a multiple of the start interval of 15 minutes."
    ]


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


def test_reservation__create__prefill_profile_data__null_values(graphql, settings):
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
    # - The user tries to create a reservation, but receives null data from Helsinki profile
    data = get_create_data(reservation_unit)
    null_data = {
        "firstName": None,
        "lastName": None,
        "primaryEmail": None,
        "primaryPhone": None,
        "primaryAddress": None,
        "verifiedPersonalInformation": None,
    }
    with mock_profile_reader(**null_data):
        response = graphql(CREATE_MUTATION, input_data=data)

    # then:
    # - There are no errors in the response
    # - The reservation is prefilled from the users profile data
    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])

    # Check that the reservation has been prefilled with the profile data
    assert reservation.reservee_first_name == ""
    assert reservation.reservee_last_name == ""
    assert reservation.reservee_email is None
    assert reservation.reservee_phone == ""
    assert reservation.reservee_address_street == ""
    assert reservation.reservee_address_zip == ""
    assert reservation.reservee_address_city == ""
    assert reservation.home_city is None


@patch_method(HelsinkiProfileClient.generic, return_value=ResponseMock(status_code=500, json_data={}))
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
@patch_method(SentryLogger.log_exception)
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

    assert SentryLogger.log_exception.call_count == 1


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
        allow_reservations_without_opening_hours=True,
        origin_hauki_resource=OriginHaukiResourceFactory.create(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
        pricings__lowest_price=Decimal(5),
        pricings__highest_price=Decimal(6),
        pricings__tax_percentage__value=Decimal(24),
        payment_types__code=PaymentType.ONLINE,
        payment_product__id=uuid.uuid4(),
    )

    graphql.login_with_regular_user()

    input_data = {
        "begin": datetime.datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime.datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "reservationUnit": reservation_unit.pk,
    }

    response = graphql(CREATE_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation = Reservation.objects.get(pk=response.first_query_object["pk"])

    assert reservation.begin == datetime.datetime(2023, 1, 1, hour=12, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime.datetime(2023, 1, 1, hour=13, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == datetime.timedelta(hours=12)
    assert reservation.buffer_time_after == datetime.timedelta(hours=11)


@freezegun.freeze_time("2021-01-01")
def test_reservation__create__reservation_block_whole_day__start_and_end_at_midnight_has_no_buffers(graphql):
    reservation_unit = ReservationUnitFactory.create(
        allow_reservations_without_opening_hours=True,
        origin_hauki_resource=OriginHaukiResourceFactory.create(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
        pricings__lowest_price=Decimal(5),
        pricings__highest_price=Decimal(6),
        pricings__tax_percentage__value=Decimal(24),
        payment_types__code=PaymentType.ONLINE,
        payment_product__id=uuid.uuid4(),
    )

    graphql.login_with_regular_user()

    input_data = {
        "begin": datetime.datetime(2023, 1, 1, hour=0, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "end": datetime.datetime(2023, 1, 2, hour=0, tzinfo=DEFAULT_TIMEZONE).isoformat(),
        "reservationUnit": reservation_unit.pk,
    }

    response = graphql(CREATE_MUTATION, input_data=input_data)
    assert response.has_errors is False, response.errors

    reservation: Reservation = Reservation.objects.get(pk=response.first_query_object["pk"])

    assert reservation.begin == datetime.datetime(2023, 1, 1, hour=0, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.end == datetime.datetime(2023, 1, 2, hour=0, tzinfo=DEFAULT_TIMEZONE)
    assert reservation.buffer_time_before == datetime.timedelta(hours=0)
    assert reservation.buffer_time_after == datetime.timedelta(hours=0)


@freezegun.freeze_time("2021-01-01 12:00")
@pytest.mark.parametrize(
    ("new_reservation_begin_delta", "error_message"),
    [
        (datetime.timedelta(hours=-3), "Reservation overlaps with existing reservations."),
        (datetime.timedelta(hours=3), "Reservation overlaps with existing reservations."),
    ],
)
def test_reservation__create__reservation_block_whole_day__blocks_reserving_for_new_reservation(
    graphql,
    new_reservation_begin_delta,
    error_message,
):
    reservation_unit = ReservationUnitFactory.create(
        allow_reservations_without_opening_hours=True,
        origin_hauki_resource=OriginHaukiResourceFactory.create(id=999),
        reservation_block_whole_day=True,
        spaces=[SpaceFactory.create()],
        pricings__lowest_price=Decimal(5),
        pricings__highest_price=Decimal(6),
        pricings__tax_percentage__value=Decimal(24),
        payment_types__code=PaymentType.ONLINE,
        payment_product__id=uuid.uuid4(),
    )

    begin = next_hour(plus_hours=5)
    end = begin + datetime.timedelta(hours=1)

    ReservationFactory.create_for_reservation_unit(reservation_unit=reservation_unit, begin=begin, end=end)

    graphql.login_with_regular_user()

    input_data = {
        "begin": (begin + new_reservation_begin_delta).isoformat(),
        "end": (end + new_reservation_begin_delta).isoformat(),
        "reservationUnit": reservation_unit.pk,
    }

    ReservationUnitHierarchy.refresh()

    response = graphql(CREATE_MUTATION, input_data=input_data)
    assert response.field_error_messages() == [error_message]


@pytest.mark.parametrize(
    ("amr", "expected"),
    [
        ("helsinkiazuread", True),
        ("suomi_fi", False),
    ],
)
def test_reservation__create__reservee_used_ad_login(graphql, amr, expected):
    reservation_unit = ReservationUnitFactory.create_reservable_now()
    CityFactory.create(name="Helsinki")
    user = UserFactory.create(social_auth__extra_data__amr=amr)
    graphql.force_login(user)

    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.get(pk=response.first_query_object["pk"])
    assert reservation.reservee_used_ad_login is expected


@freeze_time(local_datetime(2024, 1, 1))
def test_reservation__create__require_adult_reservee__is_adult(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(require_adult_reservee=True)

    user = UserFactory.create(social_auth__extra_data__amr="suomi_fi", date_of_birth=local_date(2006, 1, 1))

    graphql.force_login(user)

    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.filter(pk=response.first_query_object["pk"]).first()
    assert reservation is not None


@freeze_time(local_datetime(2024, 1, 1))
def test_reservation__create__require_adult_reservee__is_under_age(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(require_adult_reservee=True)

    user = UserFactory.create(social_auth__extra_data__amr="suomi_fi", date_of_birth=local_date(2006, 1, 2))

    graphql.force_login(user)

    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.field_error_messages() == ["Reservation unit can only be booked by an adult reservee"]


@freeze_time(local_datetime(2024, 1, 1))
def test_reservation__create__require_adult_reservee__is_under_age__reservation_unit_allows(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(require_adult_reservee=False)

    user = UserFactory.create(social_auth__extra_data__amr="suomi_fi", date_of_birth=local_date(2006, 1, 2))

    graphql.force_login(user)

    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.filter(pk=response.first_query_object["pk"]).first()
    assert reservation is not None


@freeze_time(local_datetime(2024, 1, 1))
def test_reservation__create__require_adult_reservee__is_ad_user(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(require_adult_reservee=True)

    user = UserFactory.create(social_auth__extra_data__amr="helsinkiazuread", date_of_birth=local_date(2006, 1, 1))

    graphql.force_login(user)

    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.filter(pk=response.first_query_object["pk"]).first()
    assert reservation is not None


@freeze_time(local_datetime(2024, 1, 1))
def test_reservation__create__require_adult_reservee__no_id_token(graphql):
    reservation_unit = ReservationUnitFactory.create_reservable_now(require_adult_reservee=True)

    # We don't have an ID token, so we don't know if this is an AD user.
    # Still, we have have a birthday that indicates they are an adult.
    user = UserFactory.create(date_of_birth=local_date(2006, 1, 1))

    graphql.force_login(user)

    data = get_create_data(reservation_unit)
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation = Reservation.objects.filter(pk=response.first_query_object["pk"]).first()
    assert reservation is not None
