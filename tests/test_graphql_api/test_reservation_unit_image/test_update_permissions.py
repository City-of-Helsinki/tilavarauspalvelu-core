import pytest

from reservation_units.enums import ReservationUnitImageType
from tests.factories import ReservationUnitImageFactory
from tests.helpers import UserType

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_in_memory_file_storage", "_celery_synchronous"),
]


def test_reservation_unit_image__update__regular_user(graphql):
    reservation_unit_image = ReservationUnitImageFactory.create()

    graphql.login_user_based_on_type(UserType.REGULAR)

    data = {
        "pk": reservation_unit_image.pk,
        "imageType": ReservationUnitImageType.MAP.value.upper(),
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."
