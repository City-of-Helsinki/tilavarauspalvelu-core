from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tilavarauspalvelu.enums import ReservationUnitImageType

from tests.factories import ReservationUnitFactory
from tests.helpers import create_png

from .helpers import CREATE_MUTATION

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitImage

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_image__create__regular_user(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_regular_user()

    data = {
        "image": create_png(),
        "imageType": ReservationUnitImageType.MAIN,
        "reservationUnit": reservation_unit.id,
    }
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == "No permission to create a reservation unit image"

    reservation_unit_image: ReservationUnitImage | None = reservation_unit.images.first()
    assert reservation_unit_image is None
