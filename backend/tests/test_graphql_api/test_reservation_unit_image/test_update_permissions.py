from __future__ import annotations

import pytest

from tilavarauspalvelu.enums import ReservationUnitImageType

from tests.factories import ReservationUnitImageFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_image__update__regular_user(graphql):
    reservation_unit_image = ReservationUnitImageFactory.create(image_type=ReservationUnitImageType.MAIN)

    graphql.login_with_regular_user()

    data = {
        "pk": reservation_unit_image.pk,
        "imageType": ReservationUnitImageType.OTHER,
    }
    response = graphql(UPDATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == "No permission to update a reservation unit image"
