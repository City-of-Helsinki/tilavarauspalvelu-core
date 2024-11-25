from __future__ import annotations

from io import BytesIO
from unittest import mock

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image

from tilavarauspalvelu.models import ReservationUnitImage

from tests.factories import ReservationUnitFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@mock.patch("tilavarauspalvelu.signals.create_reservation_unit_thumbnails_and_urls.delay")
@override_settings(UPDATE_RESERVATION_UNIT_THUMBNAILS=True)
def test_reservation_unit_image__save__update_urls_called_when_save(mock_update_urls):
    reservation_unit = ReservationUnitFactory.create()
    image = ReservationUnitImage(reservation_unit=reservation_unit, image_type="main")
    image.save()

    assert mock_update_urls.call_count == 1


@mock.patch("tilavarauspalvelu.signals.purge_previous_image_cache")
@override_settings(IMAGE_CACHE_ENABLED=True, UPDATE_RESERVATION_UNIT_THUMBNAILS=True)
def test_reservation_unit_image__purge__image_cache_is_purged_on_save(mock_purge_image_cache):
    mock_image_data = BytesIO()
    mock_image = Image.new("RGB", (100, 100))
    mock_image.save(fp=mock_image_data, format="PNG")
    mock_file = SimpleUploadedFile("image.png", mock_image_data.getvalue(), content_type="image/png")

    reservation_unit = ReservationUnitFactory.create()
    runit_image = ReservationUnitImage(reservation_unit=reservation_unit, image_type="main", image=mock_file)
    runit_image.save()

    assert mock_purge_image_cache.call_count == 1
