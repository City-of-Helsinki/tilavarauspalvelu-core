import datetime
import json

import freezegun
from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.test import override_settings

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from reservations.choices import CustomerTypeChoice
from tests.factories import (
    ReservationFactory,
)
from users.models import PersonalInfoViewLog


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class ReservationByPkTestCase(ReservationTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.reservation = ReservationFactory(
            reservation_unit=[cls.reservation_unit],
            reservee_first_name="Joe",
            reservee_last_name="Regular",
            reservee_phone="+358123456789",
            name="Test reservation",
            user=cls.regular_joe,
        )

    def get_query(self) -> str:
        return f"""
            {{
                reservationByPk(pk: {self.reservation.pk}) {{
                    reserveeFirstName
                    reserveeLastName
                    reserveePhone
                    name
                }}
            }}
        """

    def test_getting_reservation_by_pk(self):
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_query())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_getting_reservation_of_another_user_by_pk_does_not_reveal_reservee_name(
        self,
    ):
        unauthorized_user = get_user_model().objects.create()
        self.client.force_login(unauthorized_user)
        response = self.query(self.get_query())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_getting_reservation_of_another_user_by_pk_does_not_reveal_date_of_birth(
        self,
    ):
        unauthorized_user = get_user_model().objects.create()
        query = f"""
            {{
                reservationByPk(pk: {self.reservation.pk}) {{
                    user {{ dateOfBirth }}
                }}
            }}
        """
        self.client.force_login(unauthorized_user)
        response = self.query(query)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_getting_reservation_reservee_date_of_birth_is_logged(
        self,
    ):
        self.client.force_login(self.general_admin)
        self.regular_joe.date_of_birth = datetime.date(2020, 1, 1)
        self.regular_joe.save()

        query = f"""
            {{
                reservationByPk(pk: {self.reservation.pk}) {{
                    user {{ dateOfBirth }}
                }}
            }}
        """
        response = self.query(query)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
        assert_that(PersonalInfoViewLog.objects.count()).is_equal_to(1)
        view_log = PersonalInfoViewLog.objects.first()
        assert_that(view_log.user).is_equal_to(self.regular_joe)
        assert_that(view_log.viewer_user).is_equal_to(self.general_admin)
        assert_that(view_log.viewer_username).is_equal_to(self.general_admin.username)
        assert_that(view_log.field).is_equal_to("User.date_of_birth")
        assert_that(view_log.viewer_user_full_name).is_equal_to(self.general_admin.get_full_name())
        assert_that(view_log.viewer_user_email).is_equal_to(self.general_admin.email)

    def test_reservee_name_for_individual_reservee(self):
        reservation = ReservationFactory(
            reservee_type=CustomerTypeChoice.INDIVIDUAL,
            reservee_first_name="First",
            reservee_last_name="Last",
        )

        self.client.force_login(self.general_admin)
        query = f"""
            {{
                reservationByPk(pk: {reservation.pk}) {{
                    reserveeName
                }}
            }}
        """
        response = self.query(query)
        content = json.loads(response.content)
        assert_that(content["data"]).is_not_none()
        assert_that(content["data"]["reservationByPk"]).is_not_none()
        assert_that(content["data"]["reservationByPk"]["reserveeName"]).is_equal_to("First Last")

    def test_reservee_name_for_business_reservee(self):
        reservation = ReservationFactory(
            reservee_type=CustomerTypeChoice.BUSINESS,
            reservee_organisation_name="Business Oy",
        )

        self.client.force_login(self.general_admin)
        query = f"""
            {{
                reservationByPk(pk: {reservation.pk}) {{
                    reserveeName
                }}
            }}
        """
        response = self.query(query)
        content = json.loads(response.content)
        assert_that(content["data"]).is_not_none()
        assert_that(content["data"]["reservationByPk"]).is_not_none()
        assert_that(content["data"]["reservationByPk"]["reserveeName"]).is_equal_to("Business Oy")

    def test_reservee_name_for_nonprofit_reservee(self):
        reservation = ReservationFactory(
            reservee_type=CustomerTypeChoice.NONPROFIT,
            reservee_organisation_name="Nonprofit Ry",
        )

        self.client.force_login(self.general_admin)
        query = f"""
            {{
                reservationByPk(pk: {reservation.pk}) {{
                    reserveeName
                }}
            }}
        """
        response = self.query(query)
        content = json.loads(response.content)
        assert_that(content["data"]).is_not_none()
        assert_that(content["data"]["reservationByPk"]).is_not_none()
        assert_that(content["data"]["reservationByPk"]["reserveeName"]).is_equal_to("Nonprofit Ry")
