import datetime
import json
from unittest.mock import patch

import freezegun
from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from opening_hours.tests.test_get_periods import get_mocked_periods
from reservations.models import STATE_CHOICES
from reservations.tests.factories import ReservationFactory


@freezegun.freeze_time("2021-10-12T12:00:00Z")
@patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@patch(
    "opening_hours.hours.get_periods_for_resource", return_value=get_mocked_periods()
)
class ReservationConfirmTestCase(ReservationTestCaseBase):
    def setUp(self):
        super().setUp()
        self.reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(tz=get_default_timezone()),
            end=(
                datetime.datetime.now(tz=get_default_timezone())
                + datetime.timedelta(hours=1)
            ),
            state=STATE_CHOICES.CREATED,
            user=self.regular_joe,
        )

    def get_confirm_query(self):
        return """
            mutation confirmReservation($input: ReservationConfirmMutationInput!) {
                confirmReservation(input: $input) {
                    state
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_confirm_data(self):
        return {"pk": self.reservation.pk}

    def test_confirm_reservation_changes_state(self, mock_periods, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_confirm_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)
        response = self.query(self.get_confirm_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        confirm_data = content.get("data").get("confirmReservation")
        assert_that(confirm_data.get("errors")).is_none()
        assert_that(confirm_data.get("state")).is_equal_to(STATE_CHOICES.CONFIRMED)
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)

    def test_confirm_reservation_fails_if_state_is_not_created(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        self.reservation.state = STATE_CHOICES.DENIED
        self.reservation.save()
        input_data = self.get_valid_confirm_data()
        response = self.query(self.get_confirm_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        confirm_data = content.get("data").get("confirmReservation")
        assert_that(confirm_data.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.DENIED)

    def test_confirm_reservation_fails_on_wrong_user(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        unauthorized_user = get_user_model().objects.create()
        self.client.force_login(unauthorized_user)
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)
        input_data = self.get_valid_confirm_data()
        response = self.query(self.get_confirm_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)

    def test_confirm_reservation_updates_confirmed_at(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_confirm_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)
        self.query(self.get_confirm_query(), input_data=input_data)
        self.reservation.refresh_from_db()
        assert_that(self.reservation.confirmed_at).is_equal_to(
            datetime.datetime(2021, 10, 12, 12).astimezone()
        )
