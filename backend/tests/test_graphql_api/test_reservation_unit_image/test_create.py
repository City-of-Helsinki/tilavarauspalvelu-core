from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from tilavarauspalvelu.enums import ReservationUnitImageType

from tests.factories import ReservationUnitFactory
from tests.helpers import create_png

from .helpers import CREATE_MUTATION

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitImage

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_image__create(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_superuser()

    data = {
        "image": create_png(),
        "imageType": ReservationUnitImageType.MAIN,
        "reservationUnit": reservation_unit.id,
    }
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.has_errors is False

    reservation_unit_image: ReservationUnitImage | None = reservation_unit.images.first()
    assert reservation_unit_image is not None
    assert reservation_unit_image.image.name.startswith("reservation_unit_images/image")
    assert reservation_unit_image.image_type == ReservationUnitImageType.MAIN


def test_reservation_unit_image__create__invalid_image_type(graphql):
    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_superuser()

    data = {
        "image": create_png(),
        "imageType": "FOO",
        "reservationUnit": reservation_unit.id,
    }
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == (
        "Variable '$input' got invalid value 'FOO' at 'input.imageType'; "
        "Value 'FOO' does not exist in 'ReservationUnitImageType' enum."
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
        "imageType": ReservationUnitImageType.MAIN,
        "reservationUnit": reservation_unit.id,
    }
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0) == (
        "Variable '$input' got invalid value <InMemoryUploadedFile instance> at 'input.image'; "
        "'Image' cannot represent value <InMemoryUploadedFile instance>: "
        "File either not an image or a corrupted image."
    )

    reservation_unit_image: ReservationUnitImage | None = reservation_unit.images.first()
    assert reservation_unit_image is None


def test_reservation_unit_image__create__extension_not_allowed(graphql, settings):
    settings.LANGUAGE_CODE = "en"

    reservation_unit = ReservationUnitFactory.create()

    graphql.login_with_superuser()

    data = {
        "image": create_png(name="test_file.foo"),
        "imageType": ReservationUnitImageType.MAIN,
        "reservationUnit": reservation_unit.id,
    }
    response = graphql(CREATE_MUTATION, variables={"input": data})

    assert response.error_message(0).startswith(
        "Variable '$input' got invalid value <InMemoryUploadedFile instance> at 'input.image'; "
        "'Image' cannot represent value <InMemoryUploadedFile instance>: "
        "File extension 'foo' is not allowed. "
        "Allowed extensions are:"
    )

    reservation_unit_image: ReservationUnitImage | None = reservation_unit.images.first()
    assert reservation_unit_image is None
