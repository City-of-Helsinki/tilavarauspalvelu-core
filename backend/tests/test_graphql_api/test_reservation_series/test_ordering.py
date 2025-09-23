from __future__ import annotations

import freezegun
import pytest

from tests.factories import ReservationSeriesFactory

from .helpers import reservation_series_many_query

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
def test_reservation_series__order__by_reservation_unit_name(graphql, field):
    reservation_series_1 = ReservationSeriesFactory.create(
        reservation_unit__name_fi="1",
        reservation_unit__name_en="3",
        reservation_unit__name_sv="2",
    )
    reservation_series_2 = ReservationSeriesFactory.create(
        reservation_unit__name_fi="4",
        reservation_unit__name_en="6",
        reservation_unit__name_sv="5",
    )
    graphql.login_with_superuser()

    query = reservation_series_many_query(order_by=field)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_series_1.pk}
    assert response.node(1) == {"pk": reservation_series_2.pk}


@pytest.mark.parametrize(
    "field",
    [
        "unitNameFiAsc",
        "unitNameEnAsc",
        "unitNameSvAsc",
    ],
)
def test_reservation_series__order__by_unit_name(graphql, field):
    reservation_series_1 = ReservationSeriesFactory.create(
        reservation_unit__unit__name_fi="1",
        reservation_unit__unit__name_en="3",
        reservation_unit__unit__name_sv="2",
    )
    reservation_series_2 = ReservationSeriesFactory.create(
        reservation_unit__unit__name_fi="4",
        reservation_unit__unit__name_en="6",
        reservation_unit__unit__name_sv="5",
    )
    graphql.login_with_superuser()

    query = reservation_series_many_query(order_by=field)
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 2
    assert response.node(0) == {"pk": reservation_series_1.pk}
    assert response.node(1) == {"pk": reservation_series_2.pk}


def test_reservation_series__order__by_crated(graphql):
    with freezegun.freeze_time("2023-01-02T12:00:00Z") as frozen_time:
        reservation_series_1 = ReservationSeriesFactory.create()
        frozen_time.move_to("2023-01-03T12:00:00Z")
        reservation_series_2 = ReservationSeriesFactory.create()
        frozen_time.move_to("2023-01-01T12:00:00Z")
        reservation_series_3 = ReservationSeriesFactory.create()

    graphql.login_with_superuser()

    query = reservation_series_many_query(order_by="createdAtAsc")
    response = graphql(query)

    assert response.has_errors is False

    assert len(response.edges) == 3
    assert response.node(0) == {"pk": reservation_series_3.pk}
    assert response.node(1) == {"pk": reservation_series_1.pk}
    assert response.node(2) == {"pk": reservation_series_2.pk}
