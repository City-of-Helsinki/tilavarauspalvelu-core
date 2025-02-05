from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import ReservationUnitImageType

from tests.factories import ReservationUnitImageFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_image__update(graphql):
    reservation_unit_image = ReservationUnitImageFactory.create()

    graphql.login_with_superuser()

    data = {
        "pk": reservation_unit_image.pk,
        "imageType": ReservationUnitImageType.MAP.value.upper(),
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False

    reservation_unit_image.refresh_from_db()
    assert reservation_unit_image.image_type == ReservationUnitImageType.MAP
