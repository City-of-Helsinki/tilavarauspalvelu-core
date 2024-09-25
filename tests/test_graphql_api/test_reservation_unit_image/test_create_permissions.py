from typing import TYPE_CHECKING

import pytest

from tests.factories import ReservationUnitFactory
from tilavarauspalvelu.enums import ReservationUnitImageType

from .helpers import CREATE_MUTATION

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitImage

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_image__create__regular_user(graphql, mock_png):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_regular_user()

    data = {
        "image": mock_png,
        "imageType": ReservationUnitImageType.MAIN.value.upper(),
        "reservationUnit": reservation_unit.id,
    }
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to create."

    reservation_unit_image: ReservationUnitImage | None = reservation_unit.images.first()
    assert reservation_unit_image is None
