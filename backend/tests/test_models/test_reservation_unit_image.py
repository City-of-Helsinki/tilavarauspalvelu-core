from __future__ import annotations

from io import BytesIO
from unittest import mock

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from PIL import Image

from tilavarauspalvelu.enums import ReservationUnitImageType
from tilavarauspalvelu.models import ReservationUnitImage

from tests.factories import ReservationUnitFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@mock.patch("tilavarauspalvelu.signals.update_reservation_unit_image_urls_task.apply_async")
def test_reservation_unit_image__save__update_urls_called_on_save(
    mock_update_urls, settings, django_capture_on_commit_callbacks
):
    settings.UPDATE_RESERVATION_UNIT_THUMBNAILS = True

    reservation_unit = ReservationUnitFactory.create()
    image = ReservationUnitImage(reservation_unit=reservation_unit, image_type=ReservationUnitImageType.MAIN)
    with django_capture_on_commit_callbacks(execute=True):
        image.save()

    assert mock_update_urls.call_args_list == [mock.call(kwargs={"pks": [image.pk]})]


@mock.patch("tilavarauspalvelu.signals.purge_image_cache_task.apply_async")
def test_reservation_unit_image__purge__image_cache_is_purged_on_save(
    mock_purge_image_cache, settings, django_capture_on_commit_callbacks
):
    mock_image_data = BytesIO()
    mock_image = Image.new("RGB", (100, 100))
    mock_image.save(fp=mock_image_data, format="PNG")
    mock_file = SimpleUploadedFile("image.png", mock_image_data.getvalue(), content_type="image/png")

    reservation_unit = ReservationUnitFactory.create()
    runit_image = ReservationUnitImage(
        reservation_unit=reservation_unit,
        image_type=ReservationUnitImageType.MAIN,
        image=mock_file,
    )
    with django_capture_on_commit_callbacks(execute=True):
        runit_image.save()

    assert mock_purge_image_cache.call_count == 0

    settings.IMAGE_CACHE_ENABLED = True
    settings.UPDATE_RESERVATION_UNIT_THUMBNAILS = True

    runit_image.refresh_from_db()

    runit_image.image_type = ReservationUnitImageType.OTHER
    with django_capture_on_commit_callbacks(execute=True):
        runit_image.save()

    assert mock_purge_image_cache.call_count == 1
    assert len(mock_purge_image_cache.call_args.kwargs["kwargs"]["image_paths"]) == 4
