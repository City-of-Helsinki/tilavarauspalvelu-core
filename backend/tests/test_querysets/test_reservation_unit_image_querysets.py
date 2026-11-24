from __future__ import annotations

import pytest

from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import ReservationUnitImage

from tests.factories import ReservationUnitImageFactory
from tests.helpers import patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Update thumbnail URLs ──


@patch_method(SentryLogger.log_exception)
def test_reservation_unit_image__update_thumbnail_urls__skips_an_image_without_a_file():
    image = ReservationUnitImageFactory.create(image="")

    ReservationUnitImage.objects.filter(pk=image.pk).update_thumbnail_urls()

    assert SentryLogger.log_exception.call_count == 0

    image.refresh_from_db()
    assert image.large_url == ""
    assert image.medium_url == ""
    assert image.small_url == ""
