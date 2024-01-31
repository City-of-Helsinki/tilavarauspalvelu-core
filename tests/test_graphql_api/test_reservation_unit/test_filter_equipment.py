import pytest

from tests.factories import EquipmentFactory, ReservationUnitFactory

from .helpers import reservation_units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
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
