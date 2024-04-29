import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from reservation_units.enums import ReservationUnitImageType
from reservation_units.models import ReservationUnitImage
from tests.factories import ReservationUnitFactory

from .helpers import CREATE_MUTATION

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_image__create(graphql, mock_png):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_superuser()

    data = {
        "image": mock_png,
        "imageType": ReservationUnitImageType.MAIN.value.upper(),
        "reservationUnit": reservation_unit.id,
    }
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.has_errors is False

    reservation_unit_image: ReservationUnitImage | None = reservation_unit.images.first()
    assert reservation_unit_image is not None
    assert reservation_unit_image.image.name.startswith("reservation_unit_images/image")
    assert reservation_unit_image.image_type == ReservationUnitImageType.MAIN


def test_reservation_unit_image__create__invalid_image_type(graphql, mock_png):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_superuser()

    data = {
        "image": mock_png,
        "imageType": "FOO",
        "reservationUnit": reservation_unit.id,
    }
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == (
        "Variable '$input' got invalid value 'FOO' at 'input.imageType'; "
        "Value 'FOO' does not exist in 'ImageType' enum."
    )

    reservation_unit_image: ReservationUnitImage | None = reservation_unit.images.first()
    assert reservation_unit_image is None


def test_reservation_unit_image__create__not_a_valid_image(graphql, settings):
    settings.LANGUAGE_CODE = "en"

    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_superuser()

    test_file = SimpleUploadedFile(name="test_file.png", content=b"content", content_type="image/png")

    data = {
        "image": test_file,
        "imageType": ReservationUnitImageType.MAIN.value.upper(),
        "reservationUnit": reservation_unit.id,
    }
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("image") == [
        "Upload a valid image. The file you uploaded was either not an image or a corrupted image.",
    ]

    reservation_unit_image: ReservationUnitImage | None = reservation_unit.images.first()
    assert reservation_unit_image is None


def test_reservation_unit_image__create__extension_not_allowed(graphql, settings, mock_png):
    settings.LANGUAGE_CODE = "en"

    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_superuser()

    mock_png.name = "test_file.foo"

    data = {
        "image": mock_png,
        "imageType": ReservationUnitImageType.MAIN.value.upper(),
        "reservationUnit": reservation_unit.id,
    }
    response = graphql(CREATE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages("image")[0].startswith(
        "File extension “foo” is not allowed. Allowed extensions are:",
    )

    reservation_unit_image: ReservationUnitImage | None = reservation_unit.images.first()
    assert reservation_unit_image is None
