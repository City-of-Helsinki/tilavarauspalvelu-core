from unittest import mock

from assertpy import assert_that
from django.test import TestCase, override_settings

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
