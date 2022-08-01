import datetime
import json

import freezegun
from assertpy import assert_that
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from reservations.models import STATE_CHOICES
from reservations.tests.factories import ReservationFactory


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class ReservationWorkingMemoWriteTestCase(ReservationTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.reservation = ReservationFactory(
            reservation_unit=[cls.reservation_unit],
            begin=datetime.datetime.now(tz=get_default_timezone()),
            end=(
                datetime.datetime.now(tz=get_default_timezone())
                + datetime.timedelta(hours=1)
            ),
            state=STATE_CHOICES.REQUIRES_HANDLING,
            user=cls.regular_joe,
        )

    def get_update_memo_query(self):
        return """
            mutation updateReservationWorkingMemo($input: ReservationWorkingMemoMutationInput!) {
                updateReservationWorkingMemo(input: $input) {
                    workingMemo
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_update_data(self):
        return {"pk": self.reservation.pk, "workingMemo": "I'm looking into this"}

    def test_working_memo_saves_when_admin(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_update_data()

        response = self.query(self.get_update_memo_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()

        confirm_data = content.get("data").get("updateReservationWorkingMemo")
        assert_that(confirm_data.get("errors")).is_none()
        assert_that(confirm_data.get("workingMemo")).is_equal_to(
            input_data["workingMemo"]
        )
        self.reservation.refresh_from_db()
        assert_that(self.reservation.working_memo).is_equal_to(
            input_data["workingMemo"]
        )

    def test_working_memo_does_not_save_for_normal_user(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_update_data()

        response = self.query(self.get_update_memo_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        deny_data = content.get("data").get("updateReservationWorkingMemo")
        assert_that(deny_data).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.working_memo).is_empty()
