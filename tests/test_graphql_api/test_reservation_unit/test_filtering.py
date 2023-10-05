import pytest

from tests.factories import EquipmentFactory, ReservationUnitFactory
from tests.helpers import load_content

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]

QUERY = """
    query ($equipments: [ID]) {
        reservationUnits(equipments: $equipments) {
            edges {
                node {
                    nameFi
                }
            }
        }
    }
"""


def test_filter_reservation_units_by_one_equipment(graphql):
    # given:
    # - There are two reservation units with different equipments
    equipment_1 = EquipmentFactory.create(name="foo")
    equipment_2 = EquipmentFactory.create(name="bar")
    ReservationUnitFactory.create(name="fizz", equipments=[equipment_1])
    ReservationUnitFactory.create(name="buzz", equipments=[equipment_2])

    # when:
    # - The user requests reservation units with a specific equipment
    response = graphql(
        QUERY,
        variables={
            "equipments": [equipment_1.pk],
        },
    )

    # then:
    # - The response contains only the expected reservation unit
    content = load_content(response.content)
    notifications = content["data"]["reservationUnits"]["edges"]
    assert notifications == [{"node": {"nameFi": "fizz"}}], content


def test_filter_reservation_units_by_multiple_equipments(graphql):
    # given:
    # - There are two reservation units with different equipments, and one with both
    equipment_1 = EquipmentFactory.create(name="foo")
    equipment_2 = EquipmentFactory.create(name="bar")
    ReservationUnitFactory.create(name="fizz", equipments=[equipment_1])
    ReservationUnitFactory.create(name="buzz", equipments=[equipment_2])
    ReservationUnitFactory.create(name="1", equipments=[equipment_1, equipment_2])

    # when:
    # - The user requests reservation units with a multiple equipments
    response = graphql(
        QUERY,
        variables={
            "equipments": [equipment_1.pk, equipment_2.pk],
        },
    )

    # then:
    # - The response contains only the reservation unit with all equipments
    content = load_content(response.content)
    notifications = content["data"]["reservationUnits"]["edges"]
    assert notifications == [{"node": {"nameFi": "1"}}], content


def test_filter_reservation_units_by_multiple_equipments__none_match(graphql):
    # given:
    # - There are two reservation units with different equipments
    equipment_1 = EquipmentFactory.create(name="foo")
    equipment_2 = EquipmentFactory.create(name="bar")
    ReservationUnitFactory.create(name="fizz", equipments=[equipment_1])
    ReservationUnitFactory.create(name="buzz", equipments=[equipment_2])

    # when:
    # - The user requests reservation units with a multiple equipments
    response = graphql(
        QUERY,
        variables={
            "equipments": [equipment_1.pk, equipment_2.pk],
        },
    )

    # then:
    # - The response does not contain any reservation units
    content = load_content(response.content)
    notifications = content["data"]["reservationUnits"]["edges"]
    assert notifications == [], content
