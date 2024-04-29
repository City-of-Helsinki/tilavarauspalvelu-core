import pytest
from django.utils.timezone import get_default_timezone

from tests.factories import ReservationUnitFactory

from .helpers import reservation_units_query

DEFAULT_TIMEZONE = get_default_timezone()


# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit__order__by_name_fi(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(name_fi="1")
    reservation_unit_2 = ReservationUnitFactory.create(name_fi="2")

    query = reservation_units_query(order_by="nameFiAsc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}

    query = reservation_units_query(order_by="nameFiDesc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_2.pk}
    assert response.node(1) == {"pk": reservation_unit_1.pk}


def test_reservation_unit__order__by_name_en(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(name_en="1")
    reservation_unit_2 = ReservationUnitFactory.create(name_en="2")

    query = reservation_units_query(order_by="nameEnAsc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}

    query = reservation_units_query(order_by="nameEnDesc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_2.pk}
    assert response.node(1) == {"pk": reservation_unit_1.pk}


def test_reservation_unit__order__by_name_sv(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(name_sv="1")
    reservation_unit_2 = ReservationUnitFactory.create(name_sv="2")

    query = reservation_units_query(order_by="nameSvAsc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}

    query = reservation_units_query(order_by="nameSvDesc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_2.pk}
    assert response.node(1) == {"pk": reservation_unit_1.pk}


def test_reservation_unit__order__by_reservation_unit_type_name_fi(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(reservation_unit_type__name_fi="1")
    reservation_unit_2 = ReservationUnitFactory.create(reservation_unit_type__name_fi="2")

    query = reservation_units_query(order_by="typeFiAsc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}

    query = reservation_units_query(order_by="typeFiDesc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_2.pk}
    assert response.node(1) == {"pk": reservation_unit_1.pk}


def test_reservation_unit__order__by_reservation_unit_type_name_en(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(reservation_unit_type__name_en="1")
    reservation_unit_2 = ReservationUnitFactory.create(reservation_unit_type__name_en="2")

    query = reservation_units_query(order_by="typeEnAsc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}

    query = reservation_units_query(order_by="typeEnDesc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_2.pk}
    assert response.node(1) == {"pk": reservation_unit_1.pk}


def test_reservation_unit__order__by_reservation_unit_type_name_sv(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(reservation_unit_type__name_sv="1")
    reservation_unit_2 = ReservationUnitFactory.create(reservation_unit_type__name_sv="2")

    query = reservation_units_query(order_by="typeSvAsc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}

    query = reservation_units_query(order_by="typeSvDesc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_2.pk}
    assert response.node(1) == {"pk": reservation_unit_1.pk}


def test_reservation_unit__order__by_unit_name_fi(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(unit__name_fi="1")
    reservation_unit_2 = ReservationUnitFactory.create(unit__name_fi="2")

    query = reservation_units_query(order_by="unitNameFiAsc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}

    query = reservation_units_query(order_by="unitNameFiDesc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_2.pk}
    assert response.node(1) == {"pk": reservation_unit_1.pk}


def test_reservation_unit__order__by_unit_name_en(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(unit__name_en="1")
    reservation_unit_2 = ReservationUnitFactory.create(unit__name_en="2")

    query = reservation_units_query(order_by="unitNameEnAsc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}

    query = reservation_units_query(order_by="unitNameEnDesc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_2.pk}
    assert response.node(1) == {"pk": reservation_unit_1.pk}


def test_reservation_unit__order__by_unit_name_sv(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(unit__name_sv="1")
    reservation_unit_2 = ReservationUnitFactory.create(unit__name_sv="2")

    query = reservation_units_query(order_by="unitNameSvAsc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_2.pk}

    query = reservation_units_query(order_by="unitNameSvDesc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_unit_2.pk}
    assert response.node(1) == {"pk": reservation_unit_1.pk}


def test_reservation_unit__order__by_max_persons(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(max_persons=1)
    reservation_unit_2 = ReservationUnitFactory.create(max_persons=3)
    reservation_unit_3 = ReservationUnitFactory.create(max_persons=2)

    query = reservation_units_query(order_by="maxPersonsAsc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_3.pk}
    assert response.node(2) == {"pk": reservation_unit_2.pk}

    query = reservation_units_query(order_by="maxPersonsDesc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_unit_2.pk}
    assert response.node(1) == {"pk": reservation_unit_3.pk}
    assert response.node(2) == {"pk": reservation_unit_1.pk}


def test_reservation_unit__order__by_surface_area(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(surface_area=1)
    reservation_unit_2 = ReservationUnitFactory.create(surface_area=3)
    reservation_unit_3 = ReservationUnitFactory.create(surface_area=2)

    query = reservation_units_query(order_by="surfaceAreaAsc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_3.pk}
    assert response.node(2) == {"pk": reservation_unit_2.pk}

    query = reservation_units_query(order_by="surfaceAreaDesc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_unit_2.pk}
    assert response.node(1) == {"pk": reservation_unit_3.pk}
    assert response.node(2) == {"pk": reservation_unit_1.pk}


def test_reservation_unit__order__by_rank(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(rank=1)
    reservation_unit_2 = ReservationUnitFactory.create(rank=3)
    reservation_unit_3 = ReservationUnitFactory.create(rank=2)

    query = reservation_units_query(order_by="rankAsc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_3.pk}
    assert response.node(2) == {"pk": reservation_unit_2.pk}

    query = reservation_units_query(order_by="rankDesc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_unit_2.pk}
    assert response.node(1) == {"pk": reservation_unit_3.pk}
    assert response.node(2) == {"pk": reservation_unit_1.pk}


def test_reservation_unit__order__by_type_rank(graphql):
    reservation_unit_1 = ReservationUnitFactory.create(reservation_unit_type__rank=1)
    reservation_unit_2 = ReservationUnitFactory.create(reservation_unit_type__rank=3)
    reservation_unit_3 = ReservationUnitFactory.create(reservation_unit_type__rank=2)

    query = reservation_units_query(order_by="typeRankAsc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_unit_1.pk}
    assert response.node(1) == {"pk": reservation_unit_3.pk}
    assert response.node(2) == {"pk": reservation_unit_2.pk}

    query = reservation_units_query(order_by="typeRankDesc")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_unit_2.pk}
    assert response.node(1) == {"pk": reservation_unit_3.pk}
    assert response.node(2) == {"pk": reservation_unit_1.pk}
