import pytest

from tests.factories import ReservationUnitImageFactory
from tests.helpers import UserType

from .helpers import DELETE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_in_memory_file_storage"),
]


def test_reservation_unit_image__delete__regular_user(graphql, settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True

    reservation_unit_image = ReservationUnitImageFactory.create()

    graphql.login_user_based_on_type(UserType.REGULAR)

    response = graphql(DELETE_MUTATION, input_data={"pk": reservation_unit_image.pk})

    assert response.error_message() == "No permissions to perform delete."
