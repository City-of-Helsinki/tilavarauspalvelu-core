import datetime

import pytest

from common.date_utils import local_datetime
from reservation_units.enums import ReservationState, ReservationUnitState
from tests.factories import EquipmentFactory, ReservationUnitFactory

from .helpers import (
    create_reservation_units_for_reservation_state_filtering,
    create_reservation_units_for_reservation_unit_state_filtering,
    reservation_units_query,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_setup_verkkokauppa_env_variables"),
]


def test_reservation_unit__filter__by_equipment(graphql):
    # given:
    # - There are two reservation units with different equipments
    equipment_1 = EquipmentFactory.create(name="foo")
    equipment_2 = EquipmentFactory.create(name="bar")
    ReservationUnitFactory.create(name="fizz", equipments=[equipment_1])
    ReservationUnitFactory.create(name="buzz", equipments=[equipment_2])

    # when:
    # - The user requests reservation units with a specific equipment
    query = reservation_units_query(fields="nameFi", equipments=[equipment_1.pk])
    response = graphql(query)

    # then:
    # - The response contains only the expected reservation unit
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"nameFi": "fizz"}


def test_reservation_unit__filter__by_equipment__multiple(graphql):
    # given:
    # - There are two reservation units with different equipments, and one with both
    equipment_1 = EquipmentFactory.create(name="foo")
    equipment_2 = EquipmentFactory.create(name="bar")
    ReservationUnitFactory.create(name="fizz", equipments=[equipment_1])
    ReservationUnitFactory.create(name="buzz", equipments=[equipment_2])
    ReservationUnitFactory.create(name="1", equipments=[equipment_1, equipment_2])

    # when:
    # - The user requests reservation units with a multiple equipments
    query = reservation_units_query(fields="nameFi", equipments=[equipment_1.pk, equipment_2.pk])
    response = graphql(query)

    # then:
    # - The response contains only the reservation unit with all equipments
    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"nameFi": "1"}


def test_reservation_unit__filter__by_equipment__multiple__none_match(graphql):
    # given:
    # - There are two reservation units with different equipments
    equipment_1 = EquipmentFactory.create(name="foo")
    equipment_2 = EquipmentFactory.create(name="bar")
    ReservationUnitFactory.create(name="fizz", equipments=[equipment_1])
    ReservationUnitFactory.create(name="buzz", equipments=[equipment_2])

    # when:
    # - The user requests reservation units with a multiple equipments
    query = reservation_units_query(fields="nameFi", equipments=[equipment_1.pk, equipment_2.pk])
    response = graphql(query)

    # then:
    # - The response does not contain any reservation units
    assert response.has_errors is False, response
    assert len(response.edges) == 0, response


# Reservation state


def test_reservation_unit__filter__by_reservation_state__reservable(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_state_filtering()

    query = reservation_units_query(reservation_state=ReservationState.RESERVABLE.value)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {"pk": reservation_units.reservable_paid.pk}
    assert response.node(1) == {"pk": reservation_units.reservable_free.pk}


def test_reservation_unit__filter__by_reservation_state__scheduled_reservation(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_state_filtering()

    query = reservation_units_query(reservation_state=ReservationState.SCHEDULED_RESERVATION.value)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": reservation_units.scheduled_reservation.pk}


def test_reservation_unit__filter__by_reservation_state__scheduled_period(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_state_filtering()

    query = reservation_units_query(reservation_state=ReservationState.SCHEDULED_PERIOD.value)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": reservation_units.scheduled_period.pk}


def test_reservation_unit__filter__by_reservation_state__scheduled_closing(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_state_filtering()

    query = reservation_units_query(reservation_state=ReservationState.SCHEDULED_CLOSING.value)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {"pk": reservation_units.scheduled_closing.pk}


def test_reservation_unit__filter__by_reservation_state__reservation_closed(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_state_filtering()

    query = reservation_units_query(reservation_state=ReservationState.RESERVATION_CLOSED.value)
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 3, response
    assert response.node(0) == {"pk": reservation_units.closed.pk}
    assert response.node(1) == {"pk": reservation_units.missing_pricing.pk}
    assert response.node(2) == {"pk": reservation_units.missing_payment_product.pk}


def test_reservation_unit__filter__by_reservation_state__multiple(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_state_filtering()

    query = reservation_units_query(
        reservation_state=[ReservationState.SCHEDULED_RESERVATION.value, ReservationState.RESERVABLE.value],
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 3, response
    assert response.node(0) == {"pk": reservation_units.scheduled_reservation.pk}
    assert response.node(1) == {"pk": reservation_units.reservable_paid.pk}
    assert response.node(2) == {"pk": reservation_units.reservable_free.pk}


# Reservation unit state


def test_reservation_unit__filter__by_reservation_unit_state__archived(graphql):
    graphql.login_with_superuser()

    create_reservation_units_for_reservation_unit_state_filtering()

    query = reservation_units_query(state=ReservationUnitState.ARCHIVED.value)
    response = graphql(query)

    # Archived reservation units are always hidden
    assert response.has_errors is False
    assert len(response.edges) == 0


def test_reservation_unit__filter__by_reservation_unit_state__draft(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_unit_state_filtering()

    query = reservation_units_query(state=ReservationUnitState.DRAFT.value)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_units.draft.pk}


def test_reservation_unit__filter__by_reservation_unit_state__scheduled_publishing(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_unit_state_filtering()

    query = reservation_units_query(state=ReservationUnitState.SCHEDULED_PUBLISHING.value)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_units.scheduled_publishing.pk}


def test_reservation_unit__filter__by_reservation_unit_state__published(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_unit_state_filtering()

    query = reservation_units_query(state=ReservationUnitState.PUBLISHED.value)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_units.published.pk}


def test_reservation_unit__filter__by_reservation_unit_state__scheduled_period(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_unit_state_filtering()

    query = reservation_units_query(state=ReservationUnitState.SCHEDULED_PERIOD.value)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_units.scheduled_period.pk}


def test_reservation_unit__filter__by_reservation_unit_state__scheduled_hiding(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_unit_state_filtering()

    query = reservation_units_query(state=ReservationUnitState.SCHEDULED_HIDING.value)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_units.scheduled_hiding.pk}


def test_reservation_unit__filter__by_reservation_unit_state__hidden(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_unit_state_filtering()

    query = reservation_units_query(state=ReservationUnitState.HIDDEN.value)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 1
    assert response.node(0) == {"pk": reservation_units.hidden.pk}


def test_reservation_unit__filter__by_reservation_unit_state__multiple(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_unit_state_filtering()

    query = reservation_units_query(
        state=[
            ReservationUnitState.DRAFT.value,
            ReservationUnitState.SCHEDULED_PUBLISHING.value,
        ],
    )
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_units.draft.pk}
    assert response.node(1) == {"pk": reservation_units.scheduled_publishing.pk}


def test_reservation_unit__filter__by_reservation_unit_state__scheduled_publishing__when_begin_after_end(graphql):
    graphql.login_with_superuser()

    reservation_units = create_reservation_units_for_reservation_unit_state_filtering()

    now = local_datetime()
    reservation_unit = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
        publish_begins=(now + datetime.timedelta(days=2)),
        publish_ends=(now + datetime.timedelta(days=1)),
    )

    query = reservation_units_query(state=ReservationUnitState.SCHEDULED_PUBLISHING.value)
    response = graphql(query)

    assert response.has_errors is False
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_units.scheduled_publishing.pk}
    assert response.node(1) == {"pk": reservation_unit.pk}
