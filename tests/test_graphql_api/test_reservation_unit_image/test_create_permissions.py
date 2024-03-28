import pytest

from reservation_units.enums import ReservationUnitImageType
from reservation_units.models import ReservationUnitImage
from tests.factories import ReservationUnitFactory
from tests.helpers import UserType

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_in_memory_file_storage", "_celery_synchronous"),
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
