from io import BytesIO
from unittest import mock

from assertpy import assert_that
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from easy_thumbnails.files import get_thumbnailer
from PIL import Image

from reservation_units.models import ReservationUnitImage
from reservation_units.tests.factories import ReservationUnitFactory


class ReservationUnitImageSaveTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.res_unit = ReservationUnitFactory()

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    @mock.patch("reservation_units.models.update_urls")
    def test_update_urls_called_when_save(self, mock):
        image = ReservationUnitImage(reservation_unit=self.res_unit, image_type="main")

        image.save()

        assert_that(mock.delay.call_count).is_equal_to(1)

    @mock.patch("reservation_units.models.purge_image_cache.delay")
    @override_settings(IMAGE_CACHE_ENABLED=True)
    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_image_cache_is_purged_on_save(self, purge):
        mock_image_data = BytesIO()
        mock_image = Image.new("RGB", (100, 100))
        mock_image.save(fp=mock_image_data, format="PNG")
        mock_file = SimpleUploadedFile("image.png", mock_image_data.getvalue(), content_type="image/png")

        runit_image = ReservationUnitImage(reservation_unit=self.res_unit, image_type="main", image=mock_file)
        runit_image.save()

        aliases = settings.THUMBNAIL_ALIASES[""]
        for conf_key in list(aliases.keys()):
            image_path = get_thumbnailer(runit_image.image)[conf_key].url
            purge.assert_any_call(image_path)
