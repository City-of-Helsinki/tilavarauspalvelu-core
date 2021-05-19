import datetime
from unittest import mock

from assertpy import assert_that
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test.testcases import TestCase
from rest_framework.reverse import reverse
from rest_framework.test import APIClient

from opening_hours.hours import TimeElement
from permissions.models import GeneralRole, GeneralRoleChoice
from reservation_units.models import ReservationUnit
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.models import STATE_CHOICES
from reservations.tests.factories import ReservationFactory


def get_mocked_opening_hours():
    resource_id = f"{settings.HAUKI_ORIGIN_ID}:{ReservationUnit.objects.first().uuid}"
    return [
        {
            "resource_id": resource_id,
            "date": datetime.datetime.strptime("2021-01-01", "%Y-%m-%d").date(),
            "times": [
                TimeElement(
                    start_time=datetime.time(hour=10),
                    end_time=datetime.time(hour=22),
                    end_time_on_next_day=False,
                ),
            ],
        },
        {
            "resource_id": resource_id,
            "date": datetime.datetime.strptime("2021-01-02", "%Y-%m-%d").date(),
            "times": [
                TimeElement(
                    start_time=datetime.time(hour=10),
                    end_time=datetime.time(hour=22),
                    end_time_on_next_day=False,
                ),
            ],
        },
    ]


@mock.patch("opening_hours.utils.get_opening_hours")
class ReservationUnitCapacityTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.reservation_unit = ReservationUnitFactory()
        cls.reservation = ReservationFactory(
            reservation_unit=[cls.reservation_unit],
            begin=datetime.datetime(2020, 5, 5, 12),
            end=datetime.datetime(2020, 5, 5, 14),
            state=STATE_CHOICES.CONFIRMED,
        )

        general_admin = get_user_model().objects.create(
            username="gen_admin",
            first_name="Amin",
            last_name="General",
            email="amin.general@foo.com",
        )

        GeneralRole.objects.create(
            user=general_admin,
            role=GeneralRoleChoice.objects.get(code="admin"),
        )

        cls.api_client = APIClient()
        cls.api_client.force_authenticate(general_admin)

    def test_hour_capacity(self, mock):
        mock.return_value = get_mocked_opening_hours()
        response = self.api_client.get(
            reverse(
                "reservationunit-capacity",
            ),
            data={
                "reservation_unit": str(self.reservation_unit.id),
                "period_start": "2020-01-01",
                "period_end": "2022-01-01",
            },
            format="json",
        )

        assert_that(response.status_code).is_equal_to(200)
        assert_that(response.data[0].get("hour_capacity")).is_equal_to(24)

    def test_reservation_duration_total_in_period(self, mock):
        mock.return_value = get_mocked_opening_hours()
        response = self.api_client.get(
            reverse(
                "reservationunit-capacity",
            ),
            data={
                "reservation_unit": str(self.reservation_unit.id),
                "period_start": "2020-01-01",
                "period_end": "2022-01-01",
            },
            format="json",
        )

        assert_that(response.status_code).is_equal_to(200)
        assert_that(response.data[0].get("reservation_duration_total")).is_equal_to(2)

    def test_reservation_duration_total_when_reservation_out_of_period(self, mock):
        mock.return_value = get_mocked_opening_hours()
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime(2022, 5, 5, 12),
            end=datetime.datetime(2022, 5, 5, 14),
            state=STATE_CHOICES.CONFIRMED,
        )
        response = self.api_client.get(
            reverse(
                "reservationunit-capacity",
            ),
            data={
                "reservation_unit": str(self.reservation_unit.id),
                "period_start": "2020-01",
                "period_end": "2022-01-01",
            },
            format="json",
        )

        assert_that(response.status_code).is_equal_to(200)
        assert_that(response.data[0].get("reservation_duration_total")).is_equal_to(2)
