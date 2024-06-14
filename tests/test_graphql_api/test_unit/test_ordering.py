import pytest

from tests.factories import ReservationFactory, ReservationUnitFactory, UnitFactory, UnitGroupFactory, UserFactory
from tests.helpers import UserType

from .helpers import units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_units__order_by__name_fi(graphql):
    unit_1 = UnitFactory.create(name_fi="Unit 1")
    unit_2 = UnitFactory.create(name_fi="Unit 2")
    unit_3 = UnitFactory.create(name_fi="Unit 3")

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    # Ascending
    response = graphql(units_query(order_by="nameFiAsc"))

    assert response.has_errors is False
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": unit_1.pk}
    assert response.node(1) == {"pk": unit_2.pk}
    assert response.node(2) == {"pk": unit_3.pk}

    # Descending
    response = graphql(units_query(order_by="nameFiDesc"))

    assert response.has_errors is False
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": unit_3.pk}
    assert response.node(1) == {"pk": unit_2.pk}
    assert response.node(2) == {"pk": unit_1.pk}


def test_units__order__by_own_reservations_count(graphql):
    unit_1 = UnitFactory.create(name="1")
    unit_2 = UnitFactory.create(name="2")
    unit_3 = UnitFactory.create(name="3")
    unit_4 = UnitFactory.create(name="4")

    res_unit_1 = ReservationUnitFactory.create(unit=unit_1)
    res_unit_2 = ReservationUnitFactory.create(unit=unit_2)
    res_unit_3 = ReservationUnitFactory.create(unit=unit_3)
    res_unit_4 = ReservationUnitFactory.create(unit=unit_4)

    user_1 = UserFactory.create()
    user_2 = UserFactory.create()

    ReservationFactory.create_batch(4, reservation_unit=[res_unit_1], user=user_1)
    ReservationFactory.create(reservation_unit=[res_unit_2], user=user_1)
    ReservationFactory.create_batch(3, reservation_unit=[res_unit_3], user=user_1)
    ReservationFactory.create(reservation_unit=[res_unit_4], user=user_2)

    graphql.force_login(user_1)
    response = graphql(units_query(own_reservations=True, order_by="reservationCountDesc"))

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": unit_1.pk}
    assert response.node(1) == {"pk": unit_3.pk}
    assert response.node(2) == {"pk": unit_2.pk}


def test_units__order__by_reservation_units_count(graphql):
    unit_1 = UnitFactory.create(name="1")
    unit_2 = UnitFactory.create(name="2")
    unit_3 = UnitFactory.create(name="3")
    unit_4 = UnitFactory.create(name="4")

    for _ in range(4):
        ReservationUnitFactory.create(unit=unit_1)

    for _ in range(2):
        ReservationUnitFactory.create(unit=unit_2)

    for _ in range(3):
        ReservationUnitFactory.create(unit=unit_3)

    response = graphql(units_query(order_by="reservationUnitsCountDesc"))

    assert response.has_errors is False, response.errors

    assert len(response.edges) == 4
    assert response.node(0) == {"pk": unit_1.pk}
    assert response.node(1) == {"pk": unit_3.pk}
    assert response.node(2) == {"pk": unit_2.pk}
    assert response.node(3) == {"pk": unit_4.pk}


@pytest.mark.parametrize(
    ("language", "order"),
    [
        ("fi", [0, 1, 3, 2]),
        ("en", [0, 2, 1, 3]),
        ("sv", [0, 1, 2, 3]),
    ],
)
def test_units__order__unit_group_name(graphql, language, order):
    units = {
        0: UnitFactory.create(name="0"),
        1: UnitFactory.create(name="1"),
        2: UnitFactory.create(name="2"),
        3: UnitFactory.create(name="3"),
    }

    UnitGroupFactory.create(name="AAA", name_en="BBB", name_sv="AAA", units=[units[0], units[1]])
    UnitGroupFactory.create(name="BBB", name_en="CCC", name_sv="CCC", units=[units[3]])
    UnitGroupFactory.create(name="CCC", name_en="AAA", name_sv="BBB", units=[units[0], units[2]])

    graphql.login_with_superuser()

    query_1 = units_query(order_by=[f"unitGroupName{language.capitalize()}Asc", "pkAsc"])
    response_1 = graphql(query_1)

    assert response_1.has_errors is False, response_1.errors

    assert len(response_1.edges) == 4

    asc_order = iter(order)
    assert response_1.node(0) == {"pk": units[next(asc_order)].pk}
    assert response_1.node(1) == {"pk": units[next(asc_order)].pk}
    assert response_1.node(2) == {"pk": units[next(asc_order)].pk}
    assert response_1.node(3) == {"pk": units[next(asc_order)].pk}

    query_2 = units_query(order_by=[f"unitGroupName{language.capitalize()}Desc", "pkDesc"])
    response_2 = graphql(query_2)

    assert response_2.has_errors is False, response_2.errors

    assert len(response_2.edges) == 4

    desc_order = reversed(order)
    assert response_2.node(0) == {"pk": units[next(desc_order)].pk}
    assert response_2.node(1) == {"pk": units[next(desc_order)].pk}
    assert response_2.node(2) == {"pk": units[next(desc_order)].pk}
    assert response_2.node(3) == {"pk": units[next(desc_order)].pk}
