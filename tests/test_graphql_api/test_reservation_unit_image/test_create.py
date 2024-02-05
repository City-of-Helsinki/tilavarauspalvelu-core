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


def test_reservation_unit_image__create(graphql, settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True

    reservation_unit = ReservationUnitFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

    test_file = SimpleUploadedFile(
        name="test_file.png",
        content=b"content",
        content_type="image/png",
    )

    data = {
        "imageType": ReservationUnitImage.TYPES[0][0],
        "image": test_file.name,
        "reservationUnitPk": reservation_unit.id,
    }
    response = graphql(CREATE_MUTATION, input_data=data, files={"image": test_file})

    assert response.has_errors is False

    reservation_unit_image: ReservationUnitImage | None = reservation_unit.images.first()
    assert reservation_unit_image is not None
    assert reservation_unit_image.image.name == "reservation_unit_images/test_file.png"
    assert reservation_unit_image.image_type == "main"


def test_reservation_unit_image__create__extension_not_allowed(graphql, settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True
    settings.LANGUAGE_CODE = "en"

    reservation_unit = ReservationUnitFactory.create()

    graphql.login_user_based_on_type(UserType.SUPERUSER)

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

    assert response.error_message().startswith("File extension “xsl” is not allowed. Allowed extensions are:")

    reservation_unit_image: ReservationUnitImage | None = reservation_unit.images.first()
    assert reservation_unit_image is None
