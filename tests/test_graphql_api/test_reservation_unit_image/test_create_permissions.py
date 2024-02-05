import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from reservation_units.models import ReservationUnitImage
from tests.factories import ReservationUnitFactory
from tests.helpers import UserType

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_in_memory_file_storage"),
]


def test_reservation_unit_image__create__regular_user(graphql, settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True

    reservation_unit = ReservationUnitFactory.create()

    graphql.login_user_based_on_type(UserType.REGULAR)

    test_file = SimpleUploadedFile(
        name="test_file.xsl",
        content=b"content",
        content_type="application/xml",
    )

    data = {
        "imageType": ReservationUnitImage.TYPES[0][0],
        "image": test_file.name,
        "reservationUnitPk": reservation_unit.id,
    }
    response = graphql(CREATE_MUTATION, input_data=data, files={"image": test_file})

    assert response.error_message() == "No permission to mutate"

    reservation_unit_image: ReservationUnitImage | None = reservation_unit.images.first()
    assert reservation_unit_image is None
