import pytest

from tests.factories import ReservationUnitImageFactory
from tests.helpers import UserType

from .helpers import DELETE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_image__delete__regular_user(graphql):
    reservation_unit_image = ReservationUnitImageFactory.create()

    graphql.login_user_based_on_type(UserType.REGULAR)

    response = graphql(DELETE_MUTATION, input_data={"pk": reservation_unit_image.pk})

    assert response.error_message() == "No permission to delete."
