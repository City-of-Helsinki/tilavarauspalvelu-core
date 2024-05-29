from io import BytesIO
from unittest import mock

import pytest
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from easy_thumbnails.files import get_thumbnailer
from PIL import Image

from reservation_units.models import ReservationUnitImage
from tests.factories import ReservationUnitFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@mock.patch("reservation_units.models.reservation_unit_image.update_urls")
def test_reservation_unit_image__save__update_urls_called_when_save(mock_update_urls):
    reservation_unit = ReservationUnitFactory.create()
    image = ReservationUnitImage(reservation_unit=reservation_unit, image_type="main")
    image.save()

    assert mock_update_urls.delay.call_count == 1


@mock.patch("reservation_units.models._mixins.purge_image_cache.delay")
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
