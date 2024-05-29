from typing import TYPE_CHECKING

import pytest

from reservation_units.enums import ReservationUnitImageType
from tests.factories import ReservationUnitFactory
from tests.helpers import UserType

from .helpers import CREATE_MUTATION

if TYPE_CHECKING:
    from reservation_units.models import ReservationUnitImage

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_image__create__regular_user(graphql, mock_png):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_user_based_on_type(UserType.REGULAR)

    data = {
        "image": mock_png,
        "imageType": ReservationUnitImageType.MAIN.value.upper(),
        "reservationUnit": reservation_unit.id,
    }
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to create."

    reservation_unit_image: ReservationUnitImage | None = reservation_unit.images.first()
    assert reservation_unit_image is None
