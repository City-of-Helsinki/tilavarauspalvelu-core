import datetime
import json

import freezegun
from django.contrib.auth import get_user_model
from django.test import override_settings

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from reservations.choices import CustomerTypeChoice
from tests.factories import ReservationFactory
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
        self.client.force_login(self.general_admin)
        response = self.query(self.get_query())
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content["data"] == {
            "reservationByPk": {
                "name": "Test reservation",
                "reserveeFirstName": "Joe",
                "reserveeLastName": "Regular",
                "reserveePhone": "+358123456789",
            },
        }

    def test_getting_reservation_of_another_user_by_pk_does_not_reveal_reservee_name(self):
        unauthorized_user = get_user_model().objects.create()
        self.client.force_login(unauthorized_user)
        response = self.query(self.get_query())
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content["data"] == {
            "reservationByPk": {
                "name": None,
                "reserveeFirstName": None,
                "reserveeLastName": None,
                "reserveePhone": None,
            },
        }

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_getting_reservation_of_another_user_by_pk_does_not_reveal_date_of_birth(self):
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
        assert content.get("errors") is None
        assert content["data"] == {
            "reservationByPk": {
                "user": None,
            },
        }

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_getting_reservation_reservee_date_of_birth_is_logged(self):
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
        assert content.get("errors") is None
        assert content["data"] == {
            "reservationByPk": {
                "user": {"dateOfBirth": "2020-01-01"},
            },
        }

        assert PersonalInfoViewLog.objects.count() == 1
        view_log = PersonalInfoViewLog.objects.first()

        assert view_log.user == self.regular_joe
        assert view_log.viewer_user == self.general_admin
        assert view_log.viewer_username == self.general_admin.username
        assert view_log.field == "User.date_of_birth"
        assert view_log.viewer_user_full_name == self.general_admin.get_full_name()
        assert view_log.viewer_user_email == self.general_admin.email

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
        assert content["data"] is not None
        assert content["data"]["reservationByPk"] is not None
        assert content["data"]["reservationByPk"]["reserveeName"] == "First Last"

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
        assert content["data"] is not None
        assert content["data"]["reservationByPk"] is not None
        assert content["data"]["reservationByPk"]["reserveeName"] == "Business Oy"

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
        assert content["data"] is not None
        assert content["data"]["reservationByPk"] is not None
        assert content["data"]["reservationByPk"]["reserveeName"] == "Nonprofit Ry"
