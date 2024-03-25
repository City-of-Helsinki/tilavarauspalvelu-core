import pytest

from reservation_units.models import ReservationUnitImage
from tests.factories import ReservationUnitImageFactory
from tests.helpers import UserType

from .helpers import DELETE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_in_memory_file_storage", "_celery_synchronous"),
]


def test_reservation_unit_image__delete(graphql):
    reservation_unit_image = ReservationUnitImageFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    response = graphql(DELETE_MUTATION, input_data={"pk": reservation_unit_image.pk})

    assert response.has_errors is False
    assert ReservationUnitImage.objects.count() == 0
