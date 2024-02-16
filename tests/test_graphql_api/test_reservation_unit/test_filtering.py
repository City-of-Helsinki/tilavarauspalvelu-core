import datetime

import pytest
from django.utils.timezone import get_default_timezone

from reservation_units.enums import PricingType, ReservationState
from tests.factories import EquipmentFactory, PaymentProductFactory, ReservationUnitFactory

from .helpers import reservation_units_query

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


def create_test_reservation_units():
    now = datetime.datetime.now(tz=get_default_timezone())

    ReservationUnitFactory.create(
        name="I'm scheduled for reservation!",
        reservation_begins=(now + datetime.timedelta(hours=1)),
    )
    ReservationUnitFactory.create(
        name="Yey! I'm reservable!",
        payment_product=PaymentProductFactory.create(),
        pricings__pricing_type=PricingType.PAID,
    )
    ReservationUnitFactory.create(
        name="I'm also reservable since I'm free!",
        pricings__pricing_type=PricingType.FREE,
    )
    ReservationUnitFactory.create(
        name="I am scheduled period",
        reservation_begins=(now + datetime.timedelta(days=1)),
        reservation_ends=(now + datetime.timedelta(days=2)),
    )
    ReservationUnitFactory.create(
        name="I am scheduled closing",
        pricings__pricing_type=PricingType.FREE,
        reservation_begins=(now - datetime.timedelta(days=1)),
        reservation_ends=(now + datetime.timedelta(days=1)),
    )
    ReservationUnitFactory.create(
        name="My reservations are closed",
        reservation_begins=(now - datetime.timedelta(days=2)),
        reservation_ends=(now - datetime.timedelta(days=1)),
    )
    ReservationUnitFactory.create(
        name="Oh no, I'm not reservable due to missing pricing!",
    )
    ReservationUnitFactory.create(
        name="Oh no, I'm not reservable due to missing payment product!",
        pricings__pricing_type=PricingType.PAID,
    )


def test_reservation_unit__filter__by_reservable(graphql):
    create_test_reservation_units()
    query = reservation_units_query(
        fields="nameFi reservationState",
        order_by="name_fi",
        reservation_state=ReservationState.RESERVABLE.value,
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 2, response
    assert response.node(0) == {
        "nameFi": "I'm also reservable since I'm free!",
        "reservationState": "RESERVABLE",
    }, response
    assert response.node(1) == {
        "nameFi": "Yey! I'm reservable!",
        "reservationState": "RESERVABLE",
    }, response


def test_reservation_unit__filter__by_scheduled_reservation(graphql):
    create_test_reservation_units()
    query = reservation_units_query(
        fields="nameFi reservationState",
        order_by="name_fi",
        reservation_state=ReservationState.SCHEDULED_RESERVATION.value,
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {
        "nameFi": "I'm scheduled for reservation!",
        "reservationState": "SCHEDULED_RESERVATION",
    }, response


def test_reservation_unit__filter__by_scheduled_period(graphql):
    create_test_reservation_units()
    query = reservation_units_query(
        fields="nameFi reservationState",
        order_by="name_fi",
        reservation_state=[ReservationState.SCHEDULED_PERIOD.value],
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {
        "nameFi": "I am scheduled period",
        "reservationState": "SCHEDULED_PERIOD",
    }, response


def test_reservation_unit__filter__by_scheduled_closing(graphql):
    create_test_reservation_units()
    query = reservation_units_query(
        fields="nameFi reservationState",
        order_by="name_fi",
        reservation_state=[ReservationState.SCHEDULED_CLOSING.value],
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 1, response
    assert response.node(0) == {
        "nameFi": "I am scheduled closing",
        "reservationState": "SCHEDULED_CLOSING",
    }, response


def test_reservation_unit__filter__by_reservation_closed(graphql):
    create_test_reservation_units()
    query = reservation_units_query(
        fields="nameFi reservationState",
        order_by="name_fi",
        reservation_state=[ReservationState.RESERVATION_CLOSED.value],
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 3, response
    assert response.node(0) == {
        "nameFi": "My reservations are closed",
        "reservationState": "RESERVATION_CLOSED",
    }, response
    assert response.node(1) == {
        "nameFi": "Oh no, I'm not reservable due to missing payment product!",
        "reservationState": "RESERVATION_CLOSED",
    }, response
    assert response.node(2) == {
        "nameFi": "Oh no, I'm not reservable due to missing pricing!",
        "reservationState": "RESERVATION_CLOSED",
    }, response


def test_reservation_unit__filter__by_reservable_and_scheduled_for_reservation(graphql):
    create_test_reservation_units()
    query = reservation_units_query(
        fields="nameFi reservationState",
        order_by="name_fi",
        reservation_state=[ReservationState.SCHEDULED_RESERVATION.value, ReservationState.RESERVABLE.value],
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert len(response.edges) == 3, response
    assert response.node(0) == {
        "nameFi": "I'm also reservable since I'm free!",
        "reservationState": "RESERVABLE",
    }, response
    assert response.node(1) == {
        "nameFi": "I'm scheduled for reservation!",
        "reservationState": "SCHEDULED_RESERVATION",
    }, response
    assert response.node(2) == {
        "nameFi": "Yey! I'm reservable!",
        "reservationState": "RESERVABLE",
    }, response
