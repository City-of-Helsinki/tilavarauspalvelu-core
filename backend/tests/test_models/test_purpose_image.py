from __future__ import annotations

from io import BytesIO
from unittest import mock

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image

from tilavarauspalvelu.models import IntendedUse

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@mock.patch("tilavarauspalvelu.signals.purge_image_cache_task.delay")
@override_settings()
def test_purpose__image_purge_on_save(mock_purge_image_cache, settings):
    mock_image_data = BytesIO()
    mock_image = Image.new("RGB", (100, 100))
    mock_image.save(fp=mock_image_data, format="PNG")
    mock_file = SimpleUploadedFile("image.png", mock_image_data.getvalue(), content_type="image/png")

    purpose = IntendedUse(name="test purpose", image=mock_file)
    purpose.save()

    settings.IMAGE_CACHE_ENABLED = True

    purpose.refresh_from_db()

    purpose.name = "new test purpose"
    purpose.save()

    assert mock_purge_image_cache.call_count == 4
