from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import ReservationUnitImageType

from tests.factories import ReservationUnitFactory, ReservationUnitImageFactory
from tests.test_graphql_api.test_reservation_unit.helpers import reservation_units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_image__order_by_image_type_by_default(graphql):
    """Reservation Unit Images should always be ordered by image type"""
    ru = ReservationUnitFactory.create()

    img_1 = ReservationUnitImageFactory.create(reservation_unit=ru, image_type=ReservationUnitImageType.MAIN)
    img_2 = ReservationUnitImageFactory.create(reservation_unit=ru, image_type=ReservationUnitImageType.OTHER)
    img_3 = ReservationUnitImageFactory.create(reservation_unit=ru, image_type=ReservationUnitImageType.OTHER)
    img_4 = ReservationUnitImageFactory.create(reservation_unit=ru, image_type=ReservationUnitImageType.MAIN)

    query = reservation_units_query(fields="images { pk imageType }")
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert len(response.edges) == 1
    assert response.node(0)["images"] == [
        {"pk": img_1.pk, "imageType": ReservationUnitImageType.MAIN.value.upper()},
        {"pk": img_4.pk, "imageType": ReservationUnitImageType.MAIN.value.upper()},
        {"pk": img_2.pk, "imageType": ReservationUnitImageType.OTHER.value.upper()},
        {"pk": img_3.pk, "imageType": ReservationUnitImageType.OTHER.value.upper()},
    ]
