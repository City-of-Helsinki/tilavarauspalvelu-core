from io import BytesIO
from unittest import mock

import pytest
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from easy_thumbnails.files import get_thumbnailer
from PIL import Image

from tests.factories import PurposeFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@mock.patch("reservation_units.models._mixins.purge_image_cache.delay")
@override_settings(IMAGE_CACHE_ENABLED=True)
def test_purpose__image_purge_on_save(purge_image_cache):
    mock_image_data = BytesIO()
    mock_image = Image.new("RGB", (100, 100))
    mock_image.save(fp=mock_image_data, format="PNG")
    mock_file = SimpleUploadedFile("image.png", mock_image_data.getvalue(), content_type="image/png")

    purpose = PurposeFactory.create(name="test purpose", image=mock_file)
    purpose.save()

    aliases = settings.THUMBNAIL_ALIASES[""]
    for conf_key in list(aliases.keys()):
        image_path = get_thumbnailer(purpose.image)[conf_key].url
        purge_image_cache.assert_any_call(image_path)
