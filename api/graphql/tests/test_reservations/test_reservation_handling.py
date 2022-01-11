import datetime
import json

import freezegun
from assertpy import assert_that
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from reservations.models import STATE_CHOICES
from reservations.tests.factories import (
    ReservationFactory,
    ReservationMetadataSetFactory,
)


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class ReservationHandleTestCase(ReservationTestCaseBase):
    def setUp(self):
        super().setUp()
        metadata = ReservationMetadataSetFactory()
        self.reservation_unit.metadata_set = metadata
        self.reservation_unit.save()
        self.reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(tz=get_default_timezone())
            + datetime.timedelta(hours=1),
            end=(
                datetime.datetime.now(tz=get_default_timezone())
                + datetime.timedelta(hours=2)
            ),
            state=STATE_CHOICES.CONFIRMED,
            user=self.regular_joe,
        )

    def get_handle_query(self):
        return """
            mutation handleReservation($input: ReservationHandleMutationInput!) {
                handleReservation(input: $input) {
                    state
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_handle_data(self):
        return {"pk": self.reservation.pk, "approve": False, "denyDetails": "no can do"}

    def test_deny_success_when_admin(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_handle_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("handleReservation")
        assert_that(deny_data.get("errors")).is_none()
        assert_that(deny_data.get("state")).is_equal_to(STATE_CHOICES.DENIED.upper())
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.DENIED)
        assert_that(self.reservation.deny_details).is_equal_to("no can do")

    def test_cant_handle_if_regular_user(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_handle_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        deny_data = content.get("data").get("handleReservation")
        assert_that(deny_data).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)

    def test_approve_sets_handled_at_date(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_handle_data()
        input_data["approve"] = True
        input_data.pop("denyDetails")
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("handleReservation")
        assert_that(deny_data.get("errors")).is_none()
        assert_that(deny_data.get("state")).is_equal_to(STATE_CHOICES.CONFIRMED.upper())
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.deny_details).is_empty()
        assert_that(self.reservation.handled_at).is_not_none()

    def test_approve_discards_deny_details(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_handle_data()
        input_data["approve"] = True
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("handleReservation")
        assert_that(deny_data.get("errors")).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.deny_details).is_empty()

    def test_cant_handle_if_status_not_confirmed(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_handle_data()
        self.reservation.state = STATE_CHOICES.CREATED
        self.reservation.save()
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        handle_data = content.get("data").get("handleReservation")
        assert_that(handle_data.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)
        assert_that(self.reservation.deny_details).is_empty()

    def test_cant_handle_if_reservation_past(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_handle_data()
        self.reservation.begin = datetime.datetime.now(
            tz=get_default_timezone()
        ) - datetime.timedelta(days=1)
        self.reservation.save()
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        handle_data = content.get("data").get("handleReservation")
        assert_that(handle_data.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.deny_details).is_empty()
