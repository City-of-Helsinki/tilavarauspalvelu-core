from io import BytesIO
from unittest import mock

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image

from tilavarauspalvelu.models import Purpose

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@mock.patch("tilavarauspalvelu.signals.purge_previous_image_cache")
@override_settings(IMAGE_CACHE_ENABLED=True)
def test_purpose__image_purge_on_save(mock_purge_image_cache):
    mock_image_data = BytesIO()
    mock_image = Image.new("RGB", (100, 100))
    mock_image.save(fp=mock_image_data, format="PNG")
    mock_file = SimpleUploadedFile("image.png", mock_image_data.getvalue(), content_type="image/png")

    purpose = Purpose(name="test purpose", image=mock_file)
    purpose.save()

    assert mock_purge_image_cache.call_count == 1
