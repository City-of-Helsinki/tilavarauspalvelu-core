from __future__ import annotations

import datetime
from decimal import Decimal

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice, ApplicationStatusChoice, Weekday
from utils.date_utils import local_datetime

from tests.factories import (
    AllocatedTimeSlotFactory,
    ApplicationFactory,
    ApplicationRoundFactory,
    ApplicationSectionFactory,
    PriceComponentFactory,
    PriceOptionFactory,
    PricingGroupFactory,
    ReservationUnitFactory,
    ReservationUnitOptionFactory,
    ReservationUnitPricingGroupFactory,
    UnitGroupFactory,
    UserFactory,
)
from tests.factories.application import ApplicationBuilder

from .helpers import SET_HANDLED_MUTATION, disable_reservation_generation

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


JAN_1 = datetime.date(2027, 1, 1)
MAY_3 = datetime.date(2027, 5, 3)  # Monday
MAY_17 = datetime.date(2027, 5, 17)  # Monday
MAY_31 = datetime.date(2027, 5, 31)  # Monday


def create_allocation(*, application_round, reservation_unit, section_name="Kenttä", price_option=None):
    """An allocation on Mondays 12-14 in May 2027, in a handled application."""
    application = ApplicationFactory.create_in_status_handled_no_sections(application_round=application_round)
    section = ApplicationSectionFactory.create(
        application=application,
        name=section_name,
        price_option=price_option,
        applied_reservations_per_week=1,
        reservations_begin_date=MAY_3,
        reservations_end_date=MAY_31,
    )
    option = ReservationUnitOptionFactory.create(application_section=section, reservation_unit=reservation_unit)
    AllocatedTimeSlotFactory.create(
        reservation_unit_option=option,
        day_of_the_week=Weekday.MONDAY,
        begin_time=datetime.time(12),
        end_time=datetime.time(14),
    )


def create_unit_with_price(*, name, price_option=None, valid_until=None):
    unit_group = price_option.unit_group if price_option is not None else None
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        price_option=price_option,
        valid_from=JAN_1,
        valid_until=valid_until,
        amount=Decimal(10),
    )
    reservation_unit = ReservationUnitFactory.create(name=name)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=JAN_1,
    )
    return reservation_unit


# ── Set handled ──


def test_application_round__set_handled(graphql):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    ApplicationFactory.create_in_status_handled(application_round=application_round)

    graphql.login_with_superuser()

    with disable_reservation_generation() as mock:
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert mock.call_count == 1

    assert response.has_errors is False, response.errors

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.HANDLED


# The application period ends between 00:00 and 03:00 local time, when the UTC date is still the previous day.
@freeze_time(local_datetime(2026, 10, 12, 2))
def test_application_round__set_handled__on_the_night_the_application_period_ends(graphql):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation(
        application_period_ends_at=local_datetime(2026, 10, 12, 1),
    )
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    ApplicationFactory.create_in_status_handled(application_round=application_round)

    graphql.login_with_superuser()

    with disable_reservation_generation():
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert response.has_errors is False, response.errors

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.HANDLED


@pytest.mark.parametrize(
    "status",
    [
        ApplicationRoundStatusChoice.UPCOMING,
        ApplicationRoundStatusChoice.OPEN,
        ApplicationRoundStatusChoice.HANDLED,
        ApplicationRoundStatusChoice.RESULTS_SENT,
    ],
)
def test_application_round__set_handled__wrong_status(graphql, status):
    application_round = ApplicationRoundFactory.create_in_status(status)
    assert application_round.status == status

    graphql.login_with_superuser()

    with disable_reservation_generation():
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Application round is not in allocation status."]


def test_application_round__set_handled__general_admin(graphql):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    with disable_reservation_generation():
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert response.has_errors is False, response.errors

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.HANDLED


def test_application_round__set_handled__unit_admin(graphql):
    reservation_unit = ReservationUnitFactory.create()
    application_round = ApplicationRoundFactory.create_in_status_in_allocation(reservation_units=[reservation_unit])
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    unit = reservation_unit.unit
    admin = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(admin)

    with disable_reservation_generation():
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert response.has_errors is False, response.errors

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.HANDLED


def test_application_round__set_handled__unit_admin__no_perms_to_all_units(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()

    application_round = ApplicationRoundFactory.create_in_status_in_allocation(
        reservation_units=[reservation_unit_1, reservation_unit_2],
    )
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    unit = reservation_unit_1.unit
    admin = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(admin)

    with disable_reservation_generation():
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert response.error_message() == "No permission to update."


def test_application_round__set_handled__unit_admin__has_perms_to_all_units(graphql):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()

    application_round = ApplicationRoundFactory.create_in_status_in_allocation(
        reservation_units=[reservation_unit_1, reservation_unit_2],
    )
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    admin = UserFactory.create_with_unit_role(units=[reservation_unit_1.unit, reservation_unit_2.unit])
    graphql.force_login(admin)

    with disable_reservation_generation():
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert response.has_errors is False, response.errors

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.HANDLED


@pytest.mark.parametrize(
    ("application_status", "raises_error"),
    [
        # ApplicationStatusChoice.DRAFT is an impossible status when  ApplicationRound status is not UPCOMING or OPEN
        # ApplicationStatusChoice.RECEIVED is an impossible status if ApplicationRound status is IN_ALLOCATION
        (ApplicationStatusChoice.IN_ALLOCATION, True),
        (ApplicationStatusChoice.HANDLED, False),
        # ApplicationStatusChoice.RESULTS_SENT is an impossible status if ApplicationRound status is IN_ALLOCATION
        (ApplicationStatusChoice.EXPIRED, False),
        (ApplicationStatusChoice.CANCELLED, False),
    ],
)
def test_application_round__set_handled__error__has_applications_in_status(graphql, application_status, raises_error):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION

    application = ApplicationBuilder().with_status(application_status).in_application_round(application_round).create()
    assert application.status == application_status

    graphql.login_with_superuser()

    with disable_reservation_generation():
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    if raises_error:
        assert response.has_errors is True, response.errors
        assert response.error_message() == "Mutation was unsuccessful."
        assert response.field_error_messages() == ["Application round has applications still in allocation."]
    else:
        assert response.has_errors is False, response.errors
        application_round.refresh_from_db()
        assert application_round.status == ApplicationRoundStatusChoice.HANDLED


# ── Prices ──


def test_application_round__set_handled__all_prices_exist(graphql):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    adults = PriceOptionFactory.create(unit_group=UnitGroupFactory.create())
    reservation_unit = create_unit_with_price(name="Halli", price_option=adults)
    create_allocation(application_round=application_round, reservation_unit=reservation_unit, price_option=adults)

    graphql.login_with_superuser()

    with disable_reservation_generation() as mock:
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert response.has_errors is False, response.errors
    assert mock.call_count == 1

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.HANDLED


def test_application_round__set_handled__no_pricing_groups(graphql):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    reservation_unit = ReservationUnitFactory.create()
    create_allocation(application_round=application_round, reservation_unit=reservation_unit)

    graphql.login_with_superuser()

    with disable_reservation_generation() as mock:
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert response.has_errors is False, response.errors
    assert mock.call_count == 1

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.HANDLED


def test_application_round__set_handled__mixed_pricing_groups(graphql):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    priced_unit = create_unit_with_price(name="Halli")
    unpriced_unit = ReservationUnitFactory.create(name="Kenttä")
    create_allocation(application_round=application_round, reservation_unit=priced_unit)
    create_allocation(application_round=application_round, reservation_unit=unpriced_unit)

    graphql.login_with_superuser()

    with disable_reservation_generation() as mock:
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert mock.call_count == 0
    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        (
            "Reservation units Kenttä have no pricing group, "
            "but other reservation units of the application round have one. "
            "All reservation units must have a pricing group, or none of them."
        ),
    ]
    assert response.field_error_codes() == ["APPLICATION_ROUND_PRICING_GROUPS_MIXED"]

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION


def test_application_round__set_handled__price_missing_on_a_date(graphql):
    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    adults = PriceOptionFactory.create(unit_group=UnitGroupFactory.create())
    reservation_unit = create_unit_with_price(name="Halli", price_option=adults, valid_until=MAY_17)
    create_allocation(
        application_round=application_round,
        reservation_unit=reservation_unit,
        section_name="Sulkapallo",
        price_option=adults,
    )

    graphql.login_with_superuser()

    with disable_reservation_generation() as mock:
        response = graphql(SET_HANDLED_MUTATION, input_data={"pk": application_round.pk})

    assert mock.call_count == 0
    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        (
            "Application section 'Sulkapallo' has no price in reservation unit 'Halli' on 2027-05-17: "
            "Reservation unit has no price on 2027-05-17."
        ),
    ]
    assert response.field_error_codes() == ["APPLICATION_ROUND_PRICE_MISSING"]

    application_round.refresh_from_db()
    assert application_round.status == ApplicationRoundStatusChoice.IN_ALLOCATION
