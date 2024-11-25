import pytest

from tilavarauspalvelu.enums import ReservationUnitImageType

from tests.factories import ReservationUnitImageFactory

from .helpers import UPDATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_image__update__regular_user(graphql):
    reservation_unit_image = ReservationUnitImageFactory.create()

    graphql.login_with_regular_user()

    data = {
        "pk": reservation_unit_image.pk,
        "imageType": ReservationUnitImageType.MAP.value.upper(),
    }
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."
