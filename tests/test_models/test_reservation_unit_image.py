from io import BytesIO
from unittest import mock

import pytest
from celery import Task
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from easy_thumbnails.files import get_thumbnailer
from PIL import Image

from tests.factories import ReservationUnitFactory
from tests.helpers import patch_method
from tilavarauspalvelu.models import ReservationUnitImage

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(Task.apply_async)
def test_reservation_unit_image__save__update_urls_called_when_save():
    reservation_unit = ReservationUnitFactory.create()
    image = ReservationUnitImage(reservation_unit=reservation_unit, image_type="main")
    image.save()

    assert Task.apply_async.call_count == 1


@mock.patch("tilavarauspalvelu.utils.image_purge.purge_image_cache.delay")
@override_settings(IMAGE_CACHE_ENABLED=True)
def test_reservation_unit_image__purge__image_cache_is_purged_on_save(mock_purge_image_cache):
    mock_image_data = BytesIO()
    mock_image = Image.new("RGB", (100, 100))
    mock_image.save(fp=mock_image_data, format="PNG")
    mock_file = SimpleUploadedFile("image.png", mock_image_data.getvalue(), content_type="image/png")

    reservation_unit = ReservationUnitFactory.create()
    runit_image = ReservationUnitImage(reservation_unit=reservation_unit, image_type="main", image=mock_file)
    runit_image.save()

    aliases = settings.THUMBNAIL_ALIASES[""]
    for conf_key in list(aliases.keys()):
        image_path = get_thumbnailer(runit_image.image)[conf_key].url
        mock_purge_image_cache.assert_any_call(image_path)
