from __future__ import annotations

import datetime

import pytest

from tilavarauspalvelu.models import PriceComponent, ReservationUnitPricingGroup
from tilavarauspalvelu.services.pricing.application_round_options import (
    RoundOptionError,
    application_round_price_options,
    check_application_round_change,
    check_pricing_change_keeps_round_options,
)
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_datetime

from tests.factories import (
    ApplicationFactory,
    ApplicationRoundFactory,
    PriceComponentFactory,
    PriceOptionFactory,
    PricingGroupFactory,
    ReservationFactory,
    ReservationUnitFactory,
    ReservationUnitPricingGroupFactory,
    UnitGroupFactory,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


PERIOD_BEGIN = datetime.date(2027, 5, 1)
PERIOD_END = datetime.date(2027, 8, 31)
JAN_1 = datetime.date(2027, 1, 1)
JUN_1 = datetime.date(2027, 6, 1)


# ── Helpers ──


def create_round(reservation_units, **kwargs):
    return ApplicationRoundFactory.create(
        reservation_units=reservation_units,
        application_period_begins_at=local_datetime() - datetime.timedelta(weeks=8),
        application_period_ends_at=local_datetime() - datetime.timedelta(weeks=4),
        reservation_period_begin_date=PERIOD_BEGIN,
        reservation_period_end_date=PERIOD_END,
        **kwargs,
    )


def create_unit_using(pricing_group, begins=JAN_1):
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=begins,
    )
    return reservation_unit


def complete_reservation_creation(application_round):
    application_round.handled_at = local_datetime()
    application_round.save()
    application = ApplicationFactory.create_in_status_handled(application_round=application_round)
    ReservationFactory.create(
        reservation_series__allocated_time_slot__reservation_unit_option__application_section__application=application,
    )


# ── Offered options ──


def test_round_price_options__no_reservation_units():
    application_round = create_round([])

    assert application_round_price_options(application_round) == []


def test_round_price_options__reservation_units_without_pricing_group():
    application_round = create_round([ReservationUnitFactory.create()])

    assert application_round_price_options(application_round) == []


def test_round_price_options__shared_group__ordered_by_name():
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    juniors = PriceOptionFactory.create(unit_group=unit_group, name="Juniors")
    adults = PriceOptionFactory.create(unit_group=unit_group, name="Adults")
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=juniors, valid_from=JAN_1)
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=adults, valid_from=JAN_1)

    application_round = create_round([create_unit_using(pricing_group), create_unit_using(pricing_group)])

    assert application_round_price_options(application_round) == [adults, juniors]


def test_round_price_options__inactive_option_is_offered():
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    adults = PriceOptionFactory.create(unit_group=unit_group, is_active=False)
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=adults, valid_from=JAN_1)

    application_round = create_round([create_unit_using(pricing_group)])

    assert application_round_price_options(application_round) == [adults]


def test_round_price_options__component_for_all_options_offers_no_option():
    pricing_group = PricingGroupFactory.create()
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=None, valid_from=JAN_1)

    application_round = create_round([create_unit_using(pricing_group)])

    assert application_round_price_options(application_round) == []


def test_round_price_options__groups_with_different_options():
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group)
    juniors = PriceOptionFactory.create(unit_group=unit_group)

    first_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=first_group, price_option=adults, valid_from=JAN_1)
    PriceComponentFactory.create(pricing_group=first_group, price_option=juniors, valid_from=JAN_1)

    second_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=second_group, price_option=adults, valid_from=JAN_1)

    application_round = create_round([create_unit_using(first_group), create_unit_using(second_group)])

    assert application_round_price_options(application_round) == [adults]


def test_round_price_options__option_ends_during_period():
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    adults = PriceOptionFactory.create(unit_group=unit_group)
    juniors = PriceOptionFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=adults, valid_from=JAN_1)
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=juniors, valid_from=JAN_1, valid_until=JUN_1)

    application_round = create_round([create_unit_using(pricing_group)])

    assert application_round_price_options(application_round) == [adults]


def test_round_price_options__option_ends_on_last_day_of_period():
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    adults = PriceOptionFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        price_option=adults,
        valid_from=JAN_1,
        valid_until=PERIOD_END,
    )

    application_round = create_round([create_unit_using(pricing_group)])

    assert application_round_price_options(application_round) == []


def test_round_price_options__pricing_group_changes_during_period():
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group)

    first_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=first_group, price_option=adults, valid_from=JAN_1)
    second_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=second_group, price_option=None, valid_from=JAN_1)

    reservation_unit = create_unit_using(first_group)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=second_group,
        begins=JUN_1,
    )

    application_round = create_round([reservation_unit])

    assert application_round_price_options(application_round) == []


# ── Round change ──


def test_round_change__new_round_with_same_options():
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group)
    first_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=first_group, price_option=adults, valid_from=JAN_1)
    second_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=second_group, price_option=adults, valid_from=JAN_1)

    first_unit = create_unit_using(first_group)
    second_unit = create_unit_using(second_group)

    errors = check_application_round_change(
        application_round_pk=None,
        reservation_unit_pks=[first_unit.pk, second_unit.pk],
        period_begin=PERIOD_BEGIN,
        period_end=PERIOD_END,
    )

    assert errors == []


def test_round_change__new_round_with_different_options():
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group, name="Adults")
    juniors = PriceOptionFactory.create(unit_group=unit_group, name="Juniors")
    first_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=first_group, price_option=adults, valid_from=JAN_1)
    PriceComponentFactory.create(pricing_group=first_group, price_option=juniors, valid_from=JAN_1)
    second_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=second_group, price_option=adults, valid_from=JAN_1)

    first_unit = create_unit_using(first_group)
    second_unit = create_unit_using(second_group)

    errors = check_application_round_change(
        application_round_pk=None,
        reservation_unit_pks=[first_unit.pk, second_unit.pk],
        period_begin=PERIOD_BEGIN,
        period_end=PERIOD_END,
    )

    message = (
        f"Reservation unit {second_unit.pk} has price options 'Adults' on 2027-05-01, "
        f"but reservation unit {first_unit.pk} has 'Adults', 'Juniors' on 2027-05-01. "
        f"All reservation units must have the same price options for the whole reservation period."
    )
    assert errors == [RoundOptionError(code=error_codes.APPLICATION_ROUND_PRICE_OPTIONS_INCONSISTENT, message=message)]


def test_round_change__new_round_with_option_for_part_of_period():
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group, name="Adults")
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=adults, valid_from=JUN_1)
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=None, valid_from=JAN_1, valid_until=JUN_1)

    reservation_unit = create_unit_using(pricing_group)

    errors = check_application_round_change(
        application_round_pk=None,
        reservation_unit_pks=[reservation_unit.pk],
        period_begin=PERIOD_BEGIN,
        period_end=PERIOD_END,
    )

    message = (
        f"Reservation unit {reservation_unit.pk} has price options 'Adults' on 2027-06-01, "
        f"but reservation unit {reservation_unit.pk} has (none) on 2027-05-01. "
        f"All reservation units must have the same price options for the whole reservation period."
    )
    assert errors == [RoundOptionError(code=error_codes.APPLICATION_ROUND_PRICE_OPTIONS_INCONSISTENT, message=message)]


def test_round_change__saved_round_loses_option():
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group, name="Adults")
    juniors = PriceOptionFactory.create(unit_group=unit_group, name="Juniors")
    first_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=first_group, price_option=adults, valid_from=JAN_1)
    PriceComponentFactory.create(pricing_group=first_group, price_option=juniors, valid_from=JAN_1)
    second_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=second_group, price_option=adults, valid_from=JAN_1)

    first_unit = create_unit_using(first_group)
    second_unit = create_unit_using(second_group)
    application_round = create_round([first_unit])

    errors = check_application_round_change(
        application_round_pk=application_round.pk,
        reservation_unit_pks=[second_unit.pk],
        period_begin=PERIOD_BEGIN,
        period_end=PERIOD_END,
    )

    message = (
        "The change removes price options 'Juniors' from the application round. "
        "Applicants can select them until the reservations of the round are made."
    )
    assert errors == [RoundOptionError(code=error_codes.APPLICATION_ROUND_PRICE_OPTIONS_REMOVED, message=message)]


def test_round_change__saved_round_with_reservations_can_lose_option():
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group)
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=adults, valid_from=JAN_1)

    application_round = create_round([create_unit_using(pricing_group)])
    complete_reservation_creation(application_round)

    other_unit = ReservationUnitFactory.create()

    errors = check_application_round_change(
        application_round_pk=application_round.pk,
        reservation_unit_pks=[other_unit.pk],
        period_begin=PERIOD_BEGIN,
        period_end=PERIOD_END,
    )

    assert errors == []


# ── Pricing change ──


def test_pricing_change__option_removed_from_shared_group():
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group, name="Adults")
    juniors = PriceOptionFactory.create(unit_group=unit_group, name="Juniors")
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    adults_component = PriceComponentFactory.create(pricing_group=pricing_group, price_option=adults, valid_from=JAN_1)
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=juniors, valid_from=JAN_1)

    application_round = create_round([create_unit_using(pricing_group)], name="Summer")

    errors = check_pricing_change_keeps_round_options(
        pricing_group=pricing_group,
        components=[adults_component],
        reservation_unit_rows=None,
    )

    message = (
        f"Application round '{application_round.name}': "
        "The change removes price options 'Juniors' from the application round. "
        "Applicants can select them until the reservations of the round are made."
    )
    assert errors == [RoundOptionError(code=error_codes.APPLICATION_ROUND_PRICE_OPTIONS_REMOVED, message=message)]


def test_pricing_change__option_added_to_only_group():
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group)
    juniors = PriceOptionFactory.create(unit_group=unit_group)
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    adults_component = PriceComponentFactory.create(pricing_group=pricing_group, price_option=adults, valid_from=JAN_1)

    create_round([create_unit_using(pricing_group)])

    juniors_component = PriceComponentFactory.build(pricing_group=pricing_group, price_option=juniors, valid_from=JAN_1)
    errors = check_pricing_change_keeps_round_options(
        pricing_group=pricing_group,
        components=[adults_component, juniors_component],
        reservation_unit_rows=None,
    )

    assert errors == []


def test_pricing_change__option_added_to_one_of_two_groups():
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group, name="Adults")
    juniors = PriceOptionFactory.create(unit_group=unit_group, name="Juniors")
    first_group = PricingGroupFactory.create(unit_group=unit_group)
    first_component = PriceComponentFactory.create(pricing_group=first_group, price_option=adults, valid_from=JAN_1)
    second_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=second_group, price_option=adults, valid_from=JAN_1)

    first_unit = create_unit_using(first_group)
    second_unit = create_unit_using(second_group)
    application_round = create_round([first_unit, second_unit])

    juniors_component = PriceComponentFactory.build(pricing_group=first_group, price_option=juniors, valid_from=JAN_1)
    errors = check_pricing_change_keeps_round_options(
        pricing_group=first_group,
        components=[first_component, juniors_component],
        reservation_unit_rows=None,
    )

    message = (
        f"Application round '{application_round.name}': "
        f"Reservation unit {second_unit.pk} has price options 'Adults' on 2027-05-01, "
        f"but reservation unit {first_unit.pk} has 'Adults', 'Juniors' on 2027-05-01. "
        f"All reservation units must have the same price options for the whole reservation period."
    )
    assert errors == [RoundOptionError(code=error_codes.APPLICATION_ROUND_PRICE_OPTIONS_INCONSISTENT, message=message)]


def test_pricing_change__reservation_unit_moves_to_group_without_option():
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group, name="Adults")
    shared_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=shared_group, price_option=adults, valid_from=JAN_1)
    other_group = PricingGroupFactory.create(unit_group=unit_group)
    other_component = PriceComponentFactory.create(pricing_group=other_group, price_option=None, valid_from=JAN_1)

    reservation_unit = create_unit_using(shared_group)
    application_round = create_round([reservation_unit])

    new_row = ReservationUnitPricingGroupFactory.build(
        reservation_unit=reservation_unit,
        pricing_group=other_group,
        begins=JUN_1,
    )
    errors = check_pricing_change_keeps_round_options(
        pricing_group=other_group,
        components=[other_component],
        reservation_unit_rows=[new_row],
    )

    assert [error.code for error in errors] == [
        error_codes.APPLICATION_ROUND_PRICE_OPTIONS_INCONSISTENT,
        error_codes.APPLICATION_ROUND_PRICE_OPTIONS_REMOVED,
    ]
    assert all(error.message.startswith(f"Application round '{application_round.name}': ") for error in errors)


def test_pricing_change__new_group_without_pk():
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group)
    shared_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=shared_group, price_option=adults, valid_from=JAN_1)

    reservation_unit = create_unit_using(shared_group)
    create_round([reservation_unit])

    new_group = PricingGroupFactory.build(unit_group=unit_group)
    new_component = PriceComponent(pricing_group=new_group, price_option=adults, valid_from=JAN_1)
    new_row = ReservationUnitPricingGroup(reservation_unit=reservation_unit, pricing_group=new_group, begins=JUN_1)

    errors = check_pricing_change_keeps_round_options(
        pricing_group=new_group,
        components=[new_component],
        reservation_unit_rows=[new_row],
    )

    assert errors == []


def test_pricing_change__round_with_reservations_is_not_checked():
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group)
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=adults, valid_from=JAN_1)

    application_round = create_round([create_unit_using(pricing_group)])
    complete_reservation_creation(application_round)

    errors = check_pricing_change_keeps_round_options(
        pricing_group=pricing_group,
        components=[],
        reservation_unit_rows=None,
    )

    assert errors == []


def test_pricing_change__handled_round_without_reservations_is_checked():
    unit_group = UnitGroupFactory.create()
    adults = PriceOptionFactory.create(unit_group=unit_group)
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=adults, valid_from=JAN_1)

    application_round = create_round([create_unit_using(pricing_group)])
    application_round.handled_at = local_datetime()
    application_round.save()

    errors = check_pricing_change_keeps_round_options(
        pricing_group=pricing_group,
        components=[],
        reservation_unit_rows=None,
    )

    assert [error.code for error in errors] == [error_codes.APPLICATION_ROUND_PRICE_OPTIONS_REMOVED]
