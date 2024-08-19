import pytest

from tests.factories import ReservationUnitImageFactory

from .helpers import DELETE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_image__delete__regular_user(graphql):
    reservation_unit_image = ReservationUnitImageFactory.create()

    graphql.login_with_regular_user()

    response = graphql(DELETE_MUTATION, input_data={"pk": reservation_unit_image.pk})

    assert response.error_message() == "No permission to delete."
