import pytest

from tests.factories import ReservationFactory, ReservationUnitFactory, UnitFactory, UnitGroupFactory, UserFactory

from .helpers import units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_units__order__by_name_fi(graphql):
    unit_1 = UnitFactory.create(name_fi="Unit 1")
    unit_2 = UnitFactory.create(name_fi="Unit 2")
    unit_3 = UnitFactory.create(name_fi="Unit 3")

    graphql.login_with_superuser()

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


def test_units__order__by_reservations_count(graphql):
    units = {
        0: UnitFactory.create(name="1"),  # 4 Reservations in 2 ReservationUnits
        1: UnitFactory.create(name="2"),  # 2 Reservations in 1 ReservationUnit
        2: UnitFactory.create(name="3"),  # 3 Reservations in 1 ReservationUnit
        3: UnitFactory.create(name="4"),  # 2 Reservations in 2 ReservationUnits
    }

    res_unit_1 = ReservationUnitFactory.create(unit=units[0])
    res_unit_2 = ReservationUnitFactory.create(unit=units[0])
    res_unit_3 = ReservationUnitFactory.create(unit=units[1])
    res_unit_4 = ReservationUnitFactory.create(unit=units[2])
    res_unit_5 = ReservationUnitFactory.create(unit=units[3])
    res_unit_6 = ReservationUnitFactory.create(unit=units[3])

    ReservationFactory.create_batch(3, reservation_unit=[res_unit_1])
    ReservationFactory.create_batch(1, reservation_unit=[res_unit_2])
    ReservationFactory.create_batch(2, reservation_unit=[res_unit_3])
    ReservationFactory.create_batch(3, reservation_unit=[res_unit_4])
    ReservationFactory.create_batch(1, reservation_unit=[res_unit_5])
    ReservationFactory.create_batch(1, reservation_unit=[res_unit_6])

    # Descending
    query_1 = units_query(order_by=["reservationCountDesc", "pkDesc"])
    response_1 = graphql(query_1)

    assert response_1.has_errors is False, response_1.errors
    assert len(response_1.edges) == 4

    expected_order = [0, 2, 3, 1]

    assert response_1.node(0) == {"pk": units[expected_order[0]].pk}
    assert response_1.node(1) == {"pk": units[expected_order[1]].pk}
    assert response_1.node(2) == {"pk": units[expected_order[2]].pk}
    assert response_1.node(3) == {"pk": units[expected_order[3]].pk}

    # Ascending
    query_2 = units_query(order_by=["reservationCountAsc", "pkAsc"])
    response_2 = graphql(query_2)

    assert response_2.has_errors is False, response_2.errors
    assert len(response_2.edges) == 4

    expected_order.reverse()

    assert response_2.node(0) == {"pk": units[expected_order[0]].pk}
    assert response_2.node(1) == {"pk": units[expected_order[1]].pk}
    assert response_2.node(2) == {"pk": units[expected_order[2]].pk}
    assert response_2.node(3) == {"pk": units[expected_order[3]].pk}


def test_units__order__by_reservations_count__only_own_reservations(graphql):
    units = {
        0: UnitFactory.create(name="1"),  # 3 Reservations for user (total 4)
        1: UnitFactory.create(name="2"),  # 2 Reservations for user (total 2)
        2: UnitFactory.create(name="3"),  # 0 Reservations for user (total 3)
        3: UnitFactory.create(name="4"),  # 1 Reservation for user (total 2)
    }

    res_unit_1 = ReservationUnitFactory.create(unit=units[0])
    res_unit_2 = ReservationUnitFactory.create(unit=units[0])
    res_unit_3 = ReservationUnitFactory.create(unit=units[1])
    res_unit_4 = ReservationUnitFactory.create(unit=units[2])
    res_unit_5 = ReservationUnitFactory.create(unit=units[3])
    res_unit_6 = ReservationUnitFactory.create(unit=units[3])

    user = UserFactory.create()

    ReservationFactory.create_batch(3, reservation_unit=[res_unit_1], user=user)
    ReservationFactory.create_batch(1, reservation_unit=[res_unit_2])
    ReservationFactory.create_batch(2, reservation_unit=[res_unit_3], user=user)
    ReservationFactory.create_batch(3, reservation_unit=[res_unit_4])
    ReservationFactory.create_batch(1, reservation_unit=[res_unit_5], user=user)
    ReservationFactory.create_batch(1, reservation_unit=[res_unit_6])

    graphql.force_login(user)

    # Descending
    query_1 = units_query(own_reservations=True, order_by=["reservationCountDesc", "pkDesc"])
    response_1 = graphql(query_1)

    assert response_1.has_errors is False, response_1.errors
    assert len(response_1.edges) == 3

    # Order determined by total reservation count, not just user's.
    # 3 before 1 since using pkDesc order if reservation count is the same.
    expected_order = [0, 3, 1]

    assert response_1.node(0) == {"pk": units[expected_order[0]].pk}
    assert response_1.node(1) == {"pk": units[expected_order[1]].pk}
    assert response_1.node(2) == {"pk": units[expected_order[2]].pk}

    # Ascending
    query_2 = units_query(own_reservations=True, order_by=["reservationCountAsc", "pkAsc"])
    response_2 = graphql(query_2)

    assert response_2.has_errors is False, response_2.errors
    assert len(response_2.edges) == 3

    expected_order.reverse()

    assert response_2.node(0) == {"pk": units[expected_order[0]].pk}
    assert response_2.node(1) == {"pk": units[expected_order[1]].pk}
    assert response_2.node(2) == {"pk": units[expected_order[2]].pk}


def test_units__order__by_reservation_units_count(graphql):
    units = {
        0: UnitFactory.create(name="1"),  # 4 ReservationUnits
        1: UnitFactory.create(name="2"),  # 2 ReservationUnits
        2: UnitFactory.create(name="3"),  # 3 ReservationUnits
        3: UnitFactory.create(name="4"),  # 0 ReservationUnits
        4: UnitFactory.create(name="5"),  # 0 ReservationUnits
    }

    ReservationUnitFactory.create_batch(4, unit=units[0])
    ReservationUnitFactory.create_batch(2, unit=units[1])
    ReservationUnitFactory.create_batch(3, unit=units[2])

    # Not counted since archived
    ReservationUnitFactory.create(unit=units[2], is_archived=True)
    ReservationUnitFactory.create(unit=units[3], is_archived=True)

    # Descending
    query_1 = units_query(order_by=["reservationUnitsCountDesc", "pkDesc"])
    response_1 = graphql(query_1)

    assert response_1.has_errors is False, response_1.errors
    assert len(response_1.edges) == 5

    expected_order = [0, 2, 1, 4, 3]

    assert response_1.node(0) == {"pk": units[expected_order[0]].pk}
    assert response_1.node(1) == {"pk": units[expected_order[1]].pk}
    assert response_1.node(2) == {"pk": units[expected_order[2]].pk}
    assert response_1.node(3) == {"pk": units[expected_order[3]].pk}
    assert response_1.node(4) == {"pk": units[expected_order[4]].pk}

    # Ascending
    query_2 = units_query(order_by=["reservationUnitsCountAsc", "pkAsc"])
    response_2 = graphql(query_2)

    assert response_2.has_errors is False, response_2.errors
    assert len(response_2.edges) == 5

    expected_order.reverse()

    assert response_2.node(0) == {"pk": units[expected_order[0]].pk}
    assert response_2.node(1) == {"pk": units[expected_order[1]].pk}
    assert response_2.node(2) == {"pk": units[expected_order[2]].pk}
    assert response_2.node(3) == {"pk": units[expected_order[3]].pk}
    assert response_2.node(4) == {"pk": units[expected_order[4]].pk}


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
