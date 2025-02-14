from __future__ import annotations

import freezegun
import pytest

from tests.factories import RecurringReservationFactory

from .helpers import recurring_reservations_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize(
    "field",
    [
        "reservationUnitNameFiAsc",
        "reservationUnitNameEnAsc",
        "reservationUnitNameSvAsc",
    ],
)
def test_recurring_reservations__order__by_reservation_unit_name(graphql, field):
    recurring_reservation_1 = RecurringReservationFactory.create(
        reservation_unit__name_fi="1",
        reservation_unit__name_en="3",
        reservation_unit__name_sv="2",
    )
    recurring_reservation_2 = RecurringReservationFactory.create(
        reservation_unit__name_fi="4",
        reservation_unit__name_en="6",
        reservation_unit__name_sv="5",
    )
    graphql.login_with_superuser()

    query = recurring_reservations_query(order_by=field)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": recurring_reservation_1.pk}
    assert response.node(1) == {"pk": recurring_reservation_2.pk}


@pytest.mark.parametrize(
    "field",
    [
        "unitNameFiAsc",
        "unitNameEnAsc",
        "unitNameSvAsc",
    ],
)
def test_recurring_reservations__order__by_unit_name(graphql, field):
    recurring_reservation_1 = RecurringReservationFactory.create(
        reservation_unit__unit__name_fi="1",
        reservation_unit__unit__name_en="3",
        reservation_unit__unit__name_sv="2",
    )
    recurring_reservation_2 = RecurringReservationFactory.create(
        reservation_unit__unit__name_fi="4",
        reservation_unit__unit__name_en="6",
        reservation_unit__unit__name_sv="5",
    )
    graphql.login_with_superuser()

    query = recurring_reservations_query(order_by=field)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": recurring_reservation_1.pk}
    assert response.node(1) == {"pk": recurring_reservation_2.pk}


def test_recurring_reservations__order__by_crated(graphql):
    with freezegun.freeze_time("2023-01-02T12:00:00Z") as frozen_time:
        recurring_reservation_1 = RecurringReservationFactory.create()
        frozen_time.move_to("2023-01-03T12:00:00Z")
        recurring_reservation_2 = RecurringReservationFactory.create()
        frozen_time.move_to("2023-01-01T12:00:00Z")
        recurring_reservation_3 = RecurringReservationFactory.create()

    graphql.login_with_superuser()

    query = recurring_reservations_query(order_by="createdAsc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": recurring_reservation_3.pk}
    assert response.node(1) == {"pk": recurring_reservation_1.pk}
    assert response.node(2) == {"pk": recurring_reservation_2.pk}
