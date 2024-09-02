import datetime
from decimal import Decimal

import pytest

from common.date_utils import local_datetime
from reservation_units.enums import PriceUnit, PricingStatus
from reservation_units.models import ReservationUnitHierarchy
from reservations.enums import CustomerTypeChoice, ReservationStateChoice, ReservationTypeChoice
from tests.factories import (
    ApplicationRoundFactory,
    CityFactory,
    ReservationFactory,
    ReservationMetadataSetFactory,
    ReservationUnitPricingFactory,
)
from utils.decimal_utils import round_decimal

from .helpers import UPDATE_MUTATION, get_update_data, mock_profile_reader

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation__update(graphql):
    reservation = ReservationFactory.create_for_update()

    graphql.login_with_superuser()
    data = get_update_data(reservation)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.name == "foo"


def test_reservation__update__cannot_update_price(graphql):
    reservation = ReservationFactory.create_for_update()

    graphql.login_with_superuser()
    data = get_update_data(reservation, price=0)
    response = graphql(UPDATE_MUTATION, input_data=data)

    # Actual error doesn't matter too much, as long as price can't be updated.
    assert response.error_message().startswith("Variable '$input'")  # schema error


def test_reservation__update__overlaps_with_another_reservation(graphql):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    begin = last_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    new_begin = end
    new_end = new_begin + datetime.timedelta(hours=1)

    blocking_begin = new_begin
    blocking_end = new_end

    reservation = ReservationFactory.create_for_update(begin=begin, end=end)
    ReservationFactory.create(
        begin=blocking_begin,
        end=blocking_end,
        reservation_unit=[reservation.reservation_unit.first()],
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()
    data = get_update_data(reservation, begin=new_begin.isoformat(), end=new_end.isoformat())

    ReservationUnitHierarchy.refresh()

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Overlapping reservations are not allowed."

    reservation.refresh_from_db()
    assert reservation.begin == begin
    assert reservation.end == end


def test_reservation__update__overlaps_with_reservation_before_due_to_its_buffer(graphql):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    blocking_begin = last_hour
    blocking_end = blocking_begin + datetime.timedelta(hours=1)

    new_begin = blocking_end
    new_end = new_begin + datetime.timedelta(hours=1)

    begin = new_end
    end = begin + datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_update(begin=begin, end=end)
    ReservationFactory.create(
        begin=blocking_begin,
        end=blocking_end,
        reservation_unit=[reservation.reservation_unit.first()],
        buffer_time_after=datetime.timedelta(minutes=1),
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()
    data = get_update_data(reservation, begin=new_begin.isoformat(), end=new_end.isoformat())

    ReservationUnitHierarchy.refresh()

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation overlaps with reservation before due to buffer time."

    reservation.refresh_from_db()
    assert reservation.begin == begin
    assert reservation.end == end


def test_reservation__update__overlaps_with_reservation_after_due_to_its_buffer(graphql):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    begin = last_hour
    end = begin + datetime.timedelta(hours=1)

    new_begin = end
    new_end = new_begin + datetime.timedelta(hours=1)

    blocking_begin = new_end
    blocking_end = blocking_begin + datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_update(begin=begin, end=end)
    ReservationFactory.create(
        begin=blocking_begin,
        end=blocking_end,
        reservation_unit=[reservation.reservation_unit.first()],
        buffer_time_before=datetime.timedelta(minutes=1),
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()
    data = get_update_data(reservation, begin=new_begin.isoformat(), end=new_end.isoformat())

    ReservationUnitHierarchy.refresh()

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation overlaps with reservation after due to buffer time."

    reservation.refresh_from_db()
    assert reservation.begin == begin
    assert reservation.end == end


def test_reservation__update__overlaps_with_reservation_before_due_to_own_buffer(graphql):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    begin = last_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    blocking_begin = end
    blocking_end = blocking_begin + datetime.timedelta(hours=1)

    new_begin = blocking_end
    new_end = new_begin + datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_update(
        begin=begin,
        end=end,
        # Use reservation unit buffer!
        reservation_unit__buffer_time_before=datetime.timedelta(minutes=1),
    )
    ReservationFactory.create(
        begin=blocking_begin,
        end=blocking_end,
        reservation_unit=[reservation.reservation_unit.first()],
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()
    data = get_update_data(
        reservation,
        begin=new_begin.isoformat(),
        end=new_end.isoformat(),
        # Cannot set buffer time on update!
    )

    ReservationUnitHierarchy.refresh()

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation overlaps with reservation before due to buffer time."

    reservation.refresh_from_db()
    assert reservation.begin == begin
    assert reservation.end == end


def test_reservation__update__overlaps_with_reservation_after_due_to_own_buffer(graphql):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)

    begin = last_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    new_begin = end
    new_end = new_begin + datetime.timedelta(hours=1)

    blocking_begin = new_end
    blocking_end = blocking_begin + datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_update(
        begin=begin,
        end=end,
        # Use reservation unit buffer!
        reservation_unit__buffer_time_after=datetime.timedelta(minutes=1),
    )
    ReservationFactory.create(
        begin=blocking_begin,
        end=blocking_end,
        reservation_unit=[reservation.reservation_unit.first()],
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
    )

    graphql.login_with_superuser()
    data = get_update_data(
        reservation,
        begin=new_begin.isoformat(),
        end=new_end.isoformat(),
        # Cannot set buffer time on update!
    )

    ReservationUnitHierarchy.refresh()

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation overlaps with reservation after due to buffer time."

    reservation.refresh_from_db()
    assert reservation.begin == begin
    assert reservation.end == end


def test_reservation__update__reservation_unit_closed(graphql):
    reservation = ReservationFactory.create_for_update()

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)
    begin = last_hour + datetime.timedelta(days=3, hours=1)
    end = begin + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_update_data(reservation, begin=begin.isoformat(), end=end.isoformat())
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation unit is not open within desired reservation time."


def test_reservation__update__reservation_unit_closed__opening_hours_are_ignored(graphql):
    reservation = ReservationFactory.create_for_update(reservation_unit__allow_reservations_without_opening_hours=True)

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)
    begin = last_hour + datetime.timedelta(days=3, hours=1)
    end = begin + datetime.timedelta(hours=1)

    graphql.login_with_superuser()
    data = get_update_data(reservation, begin=begin.isoformat(), end=end.isoformat())
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.begin == begin
    assert reservation.end == end


def test_reservation__update__reservation_unit_in_open_application_round(graphql):
    reservation = ReservationFactory.create_for_update()

    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)
    begin = last_hour + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    ApplicationRoundFactory.create_in_status_open(
        reservation_units=[reservation.reservation_unit.first()],
        reservation_period_begin=begin.date(),
        reservation_period_end=end.date(),
    )

    graphql.login_with_superuser()
    data = get_update_data(reservation, begin=begin.isoformat(), end=end.isoformat())
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "One or more reservation units are in open application round."


def test_reservation__update__reservation_unit_max_reservation_duration_exceeded(graphql):
    reservation = ReservationFactory.create_for_update(
        reservation_unit__max_reservation_duration=datetime.timedelta(minutes=30),
    )

    graphql.login_with_superuser()
    data = get_update_data(reservation)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation duration exceeds one or more reservation unit's maximum duration."


def test_reservation__update__update_fails_when_reservation_unit_min_reservation_duration_subceeded(graphql):
    reservation = ReservationFactory.create_for_update(
        reservation_unit__min_reservation_duration=datetime.timedelta(hours=3),
    )

    graphql.login_with_superuser()
    data = get_update_data(reservation)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Reservation duration less than one or more reservation unit's minimum duration."


def test_reservation__update__regular_user(graphql):
    reservation = ReservationFactory.create_for_update()

    graphql.login_with_regular_user()
    input_data = get_update_data(reservation)
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    assert response.error_message() == "No permission to update."


def test_reservation__update__cancel(graphql):
    reservation = ReservationFactory.create_for_update()

    input_data = get_update_data(reservation, state=ReservationStateChoice.CANCELLED.upper())
    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CANCELLED


def test_reservation__update__confirm(graphql):
    reservation = ReservationFactory.create_for_update()

    input_data = get_update_data(reservation, state=ReservationStateChoice.CONFIRMED.upper())
    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=input_data)

    assert response.error_message() == "Setting the reservation state to 'CONFIRMED' is not allowed."


def test_reservation__update__all_required_fields_are_filled(graphql):
    metadata_set = ReservationMetadataSetFactory.create_basic()
    reservation = ReservationFactory.create_for_update(
        reservation_unit__metadata_set=metadata_set,
    )

    data = get_update_data(reservation)
    data["reserveeFirstName"] = "John"
    data["reserveeLastName"] = "Doe"
    data["reserveeEmail"] = "john.doe@example.com"
    data["reserveePhone"] = "+358123456789"

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.reservee_first_name == data["reserveeFirstName"]
    assert reservation.reservee_last_name == data["reserveeLastName"]
    assert reservation.reservee_email == data["reserveeEmail"]
    assert reservation.reservee_phone == data["reserveePhone"]


def test_reservation__update__missing_reservee_id_for_unregistered_organisation(graphql):
    metadata_set = ReservationMetadataSetFactory.create_basic(
        supported_fields=[
            "reservee_first_name",
            "reservee_last_name",
            "reservee_is_unregistered_association",
            "reservee_id",
        ],
        required_fields=[
            "reservee_first_name",
            "reservee_last_name",
            "reservee_is_unregistered_association",
            "reservee_id",
        ],
    )
    reservation = ReservationFactory.create_for_update(reservation_unit__metadata_set=metadata_set)

    data = get_update_data(reservation)
    data["reserveeFirstName"] = "John"
    data["reserveeLastName"] = "Doe"
    # Note: Reservee ID is missing!
    data["reserveeIsUnregisteredAssociation"] = True

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.reservee_first_name == data["reserveeFirstName"]
    assert reservation.reservee_last_name == data["reserveeLastName"]
    assert reservation.reservee_is_unregistered_association is True
    assert reservation.reservee_id == ""


def test_reservation__update__missing_home_city_for_individual(graphql):
    metadata_set = ReservationMetadataSetFactory.create_basic(
        supported_fields=[
            "reservee_first_name",
            "reservee_last_name",
            "reservee_type",
            "home_city",
        ],
        required_fields=[
            "reservee_first_name",
            "reservee_last_name",
            "reservee_type",
            "home_city",
        ],
    )
    reservation = ReservationFactory.create_for_update(reservation_unit__metadata_set=metadata_set)
    CityFactory.create(name="Helsinki")  # Create some city, but it should not be used

    data = get_update_data(reservation)
    data["reserveeFirstName"] = "John"
    data["reserveeLastName"] = "Doe"
    data["reserveeType"] = CustomerTypeChoice.INDIVIDUAL.value

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.reservee_first_name == data["reserveeFirstName"]
    assert reservation.reservee_last_name == data["reserveeLastName"]
    assert reservation.reservee_type == CustomerTypeChoice.INDIVIDUAL.value
    assert reservation.home_city is None


def test_reservation__update__missing_reservee_id_for_individual(graphql):
    metadata_set = ReservationMetadataSetFactory.create_basic(
        supported_fields=[
            "reservee_first_name",
            "reservee_last_name",
            "reservee_type",
            "reservee_id",
        ],
        required_fields=[
            "reservee_first_name",
            "reservee_last_name",
            "reservee_type",
            "reservee_id",
        ],
    )
    reservation = ReservationFactory.create_for_update(reservation_unit__metadata_set=metadata_set)
    CityFactory.create(name="Helsinki")  # Create some city, but it should not be used

    data = get_update_data(reservation)
    data["reserveeFirstName"] = "John"
    data["reserveeLastName"] = "Doe"
    data["reserveeType"] = CustomerTypeChoice.INDIVIDUAL.value

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.reservee_first_name == data["reserveeFirstName"]
    assert reservation.reservee_last_name == data["reserveeLastName"]
    assert reservation.reservee_type == CustomerTypeChoice.INDIVIDUAL.value
    assert reservation.reservee_id == ""


def test_reservation__update__missing_reservee_organisation_name_for_individual(graphql):
    metadata_set = ReservationMetadataSetFactory.create_basic(
        supported_fields=[
            "reservee_first_name",
            "reservee_last_name",
            "reservee_type",
            "reservee_organisation_name",
        ],
        required_fields=[
            "reservee_first_name",
            "reservee_last_name",
            "reservee_type",
            "reservee_organisation_name",
        ],
    )
    reservation = ReservationFactory.create_for_update(reservation_unit__metadata_set=metadata_set)
    CityFactory.create(name="Helsinki")  # Create some city, but it should not be used

    data = get_update_data(reservation)
    data["reserveeFirstName"] = "John"
    data["reserveeLastName"] = "Doe"
    data["reserveeType"] = CustomerTypeChoice.INDIVIDUAL.value

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.reservee_first_name == data["reserveeFirstName"]
    assert reservation.reservee_last_name == data["reserveeLastName"]
    assert reservation.reservee_type == CustomerTypeChoice.INDIVIDUAL.value
    assert reservation.reservee_organisation_name == ""


def test_reservation__update__some_required_fields_are_missing(graphql):
    metadata_set = ReservationMetadataSetFactory.create_basic()
    reservation = ReservationFactory.create_for_update(
        reservation_unit__metadata_set=metadata_set,
    )

    data = get_update_data(reservation)
    data["reserveeFirstName"] = "John"
    data["reserveeLastName"] = "Doe"
    data["reserveeEmail"] = "john.doe@example.com"

    graphql.login_with_superuser()
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Value for required field reserveePhone is missing."


def test_reservation__update__already_has_max_reservations_per_user(graphql):
    reservation = ReservationFactory.create_for_update(reservation_unit__max_reservations_per_user=1)

    graphql.login_with_superuser()
    update_data = get_update_data(reservation)
    response = graphql(UPDATE_MUTATION, input_data=update_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.name == "foo"


def test_reservation__update__price_calculation_not_triggered_if_time_not_changed(graphql):
    reservation = ReservationFactory.create_for_update(
        price=Decimal("12.4"),
        non_subsidised_price=Decimal("12.4"),
        unit_price=Decimal("10.0"),
        tax_percentage_value=Decimal("24"),
    )
    price = reservation.price
    price_net = reservation.price_net
    non_subsidised_price = reservation.non_subsidised_price
    non_subsidised_price_net = reservation.non_subsidised_price_net
    unit_price = reservation.unit_price
    tax_percentage_value = reservation.tax_percentage_value

    ReservationUnitPricingFactory.create(
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        reservation_unit=reservation.reservation_unit.first(),
        highest_price=Decimal("20.0"),
    )

    graphql.login_with_superuser()
    update_data = get_update_data(reservation)
    response = graphql(UPDATE_MUTATION, input_data=update_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.price == price
    assert reservation.price_net == price_net
    assert reservation.non_subsidised_price == non_subsidised_price
    assert reservation.non_subsidised_price_net == non_subsidised_price_net
    assert reservation.unit_price == unit_price
    assert reservation.tax_percentage_value == tax_percentage_value


def test_reservation__update__price_calculation_triggered_if_begin_changes(graphql):
    reservation = ReservationFactory.create_for_update(
        price=Decimal("12.4"),
        non_subsidised_price=Decimal("12.4"),
        unit_price=Decimal("10.0"),
        tax_percentage_value=Decimal("24"),
    )

    pricing = ReservationUnitPricingFactory.create(
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        reservation_unit=reservation.reservation_unit.first(),
        highest_price=Decimal("20.0"),
    )

    begin = reservation.begin + datetime.timedelta(minutes=30)

    graphql.login_with_superuser()
    update_data = get_update_data(reservation, begin=begin.isoformat())
    response = graphql(UPDATE_MUTATION, input_data=update_data)

    assert response.has_errors is False, response.errors

    price = pricing.highest_price
    price_net = round_decimal(pricing.highest_price / pricing.tax_percentage.multiplier, 2)

    reservation.refresh_from_db()
    assert reservation.price == price
    assert reservation.price_net == price_net
    assert reservation.non_subsidised_price == price
    assert reservation.non_subsidised_price_net == price_net
    assert reservation.unit_price == price
    assert reservation.tax_percentage_value == pricing.tax_percentage.value


def test_reservation__update__price_calculation_triggered_if_end_changes(graphql):
    reservation = ReservationFactory.create_for_update(
        price=Decimal("12.4"),
        non_subsidised_price=Decimal("12.4"),
        unit_price=Decimal("10.0"),
        tax_percentage_value=Decimal("24"),
    )

    pricing = ReservationUnitPricingFactory.create(
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        reservation_unit=reservation.reservation_unit.first(),
        highest_price=Decimal("20.0"),
    )

    end = reservation.end - datetime.timedelta(minutes=30)

    graphql.login_with_superuser()
    update_data = get_update_data(reservation, end=end.isoformat())
    response = graphql(UPDATE_MUTATION, input_data=update_data)

    assert response.has_errors is False, response.errors

    price = pricing.highest_price
    price_net = round_decimal(pricing.highest_price / pricing.tax_percentage.multiplier, 2)

    reservation.refresh_from_db()
    assert reservation.price == price
    assert reservation.price_net == price_net
    assert reservation.non_subsidised_price == price
    assert reservation.non_subsidised_price_net == price_net
    assert reservation.unit_price == price
    assert reservation.tax_percentage_value == pricing.tax_percentage.value


def test_reservation__update__price_calculation_triggered_if_unit_changes(graphql):
    reservation = ReservationFactory.create_for_update(
        price=Decimal("12.4"),
        non_subsidised_price=Decimal("12.4"),
        unit_price=Decimal("10.0"),
        tax_percentage_value=Decimal("24"),
    )

    pricing = ReservationUnitPricingFactory.create(
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        highest_price=Decimal("20.0"),
        reservation_unit__origin_hauki_resource=reservation.reservation_unit.first().origin_hauki_resource,
    )

    graphql.login_with_superuser()
    update_data = get_update_data(reservation, reservationUnitPks=[pricing.reservation_unit.pk])
    response = graphql(UPDATE_MUTATION, input_data=update_data)

    assert response.has_errors is False, response.errors

    price = pricing.highest_price
    price_net = round_decimal(pricing.highest_price / pricing.tax_percentage.multiplier, 2)

    reservation.refresh_from_db()
    assert reservation.price == price
    assert reservation.price_net == price_net
    assert reservation.non_subsidised_price == price
    assert reservation.non_subsidised_price_net == price_net
    assert reservation.unit_price == price
    assert reservation.tax_percentage_value == pricing.tax_percentage.value


def test_reservation__update__price_calculation_uses_to_future_pricing(graphql):
    reservation = ReservationFactory.create_for_update(
        price=Decimal("12.4"),
        non_subsidised_price=Decimal("12.4"),
        unit_price=Decimal("10.0"),
        tax_percentage_value=Decimal("24"),
    )

    pricing_change = reservation.begin + datetime.timedelta(days=1)
    begin = pricing_change + datetime.timedelta(hours=1)
    end = begin + datetime.timedelta(hours=1)

    ReservationUnitPricingFactory.create(
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        status=PricingStatus.PRICING_STATUS_ACTIVE,
        highest_price=Decimal("20.0"),
        tax_percentage__value=Decimal("25.5"),
        reservation_unit=reservation.reservation_unit.first(),
    )

    pricing = ReservationUnitPricingFactory.create(
        begins=pricing_change,
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        status=PricingStatus.PRICING_STATUS_FUTURE,
        highest_price=Decimal("30.0"),
        tax_percentage__value=Decimal("25.5"),
        reservation_unit=reservation.reservation_unit.first(),
    )

    graphql.login_with_superuser()
    update_data = get_update_data(reservation, begin=begin.isoformat(), end=end.isoformat())
    response = graphql(UPDATE_MUTATION, input_data=update_data)

    assert response.has_errors is False, response.errors

    price = pricing.highest_price
    price_net = round_decimal(pricing.highest_price / pricing.tax_percentage.multiplier, 2)

    reservation.refresh_from_db()
    assert reservation.price == price
    assert reservation.price_net == price_net
    assert reservation.non_subsidised_price == price
    assert reservation.non_subsidised_price_net == price_net
    assert reservation.unit_price == price
    assert reservation.tax_percentage_value == pricing.tax_percentage.value


def test_reservation__update__require_free_of_charge_reason_if_applying_for_free_of_charge(graphql):
    reservation = ReservationFactory.create_for_update()

    graphql.login_with_superuser()
    data = get_update_data(reservation, applyingForFreeOfCharge=True)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Free of charge reason is mandatory when applying for free of charge."


def test_reservation__update__reservation_details_does_not_get_overridden_with_profile_data(graphql, settings):
    settings.PREFILL_RESERVATION_WITH_PROFILE_DATA = True

    reservation = ReservationFactory.create_for_update(
        reservee_first_name="Jane",
        reservee_last_name="Doe",
    )

    graphql.login_with_superuser()
    data = get_update_data(reservation)
    with mock_profile_reader():
        response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.reservee_first_name == "Jane"
