import pytest

from reservation_units.models import ReservationUnitImage
from tests.factories import ReservationUnitImageFactory
from tests.helpers import UserType

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_in_memory_file_storage"),
]


def test_reservation_unit_image__update__regular_user(graphql, settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True

    reservation_unit_image = ReservationUnitImageFactory.create()

    graphql.login_user_based_on_type(UserType.REGULAR)

    data = {
        "pk": reservation_unit_image.pk,
        "imageType": ReservationUnitImage.TYPES[3][0],
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to mutate"
