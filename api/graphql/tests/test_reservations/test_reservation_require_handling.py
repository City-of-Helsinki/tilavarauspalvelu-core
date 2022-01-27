import datetime
import json

import freezegun
from assertpy import assert_that
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.models import STATE_CHOICES
from reservations.tests.factories import (
    ReservationFactory,
    ReservationMetadataSetFactory,
)


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class ReservationApproveTestCase(ReservationTestCaseBase):
    def setUp(self):
        super().setUp()
        metadata = ReservationMetadataSetFactory()
        self.reservation_unit.metadata_set = metadata
        self.reservation_unit.save()
        reservation_unit = ReservationUnitFactory()
        self.confirmed_reservation = ReservationFactory(
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
        self.denied_reservation = ReservationFactory(
            reservation_unit=[reservation_unit],
            begin=datetime.datetime.now(tz=get_default_timezone())
            + datetime.timedelta(hours=1),
            end=(
                datetime.datetime.now(tz=get_default_timezone())
                + datetime.timedelta(hours=2)
            ),
            state=STATE_CHOICES.DENIED,
            user=self.regular_joe,
        )

    def get_require_handling_query(self):
        return """
            mutation requireHandlingForReservation($input: ReservationRequiresHandlingMutationInput!) {
                requireHandlingForReservation(input: $input) {
                    state
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def test_require_handling_succeed_on_confirmed_reservation(self):
        self.client.force_login(self.general_admin)
        input_data = {"pk": self.confirmed_reservation.id}
        assert_that(self.confirmed_reservation.state).is_equal_to(
            STATE_CHOICES.CONFIRMED
        )
        response = self.query(self.get_require_handling_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        approve_data = content.get("data").get("requireHandlingForReservation")
        assert_that(approve_data.get("errors")).is_none()
        assert_that(approve_data.get("state")).is_equal_to(
            STATE_CHOICES.REQUIRES_HANDLING.upper()
        )
        self.confirmed_reservation.refresh_from_db()
        assert_that(self.confirmed_reservation.state).is_equal_to(
            STATE_CHOICES.REQUIRES_HANDLING
        )

    def test_require_handling_succeed_on_denied_reservation(self):
        self.client.force_login(self.general_admin)
        input_data = {"pk": self.denied_reservation.id}
        assert_that(self.denied_reservation.state).is_equal_to(STATE_CHOICES.DENIED)
        response = self.query(self.get_require_handling_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        approve_data = content.get("data").get("requireHandlingForReservation")
        assert_that(approve_data.get("errors")).is_none()
        assert_that(approve_data.get("state")).is_equal_to(
            STATE_CHOICES.REQUIRES_HANDLING.upper()
        )
        self.denied_reservation.refresh_from_db()
        assert_that(self.denied_reservation.state).is_equal_to(
            STATE_CHOICES.REQUIRES_HANDLING
        )

    def test_cant_deny_if_regular_user(self):
        self.client.force_login(self.regular_joe)
        input_data = {"pk": self.denied_reservation.id}
        assert_that(self.denied_reservation.state).is_equal_to(STATE_CHOICES.DENIED)
        response = self.query(self.get_require_handling_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        deny_data = content.get("data").get("requireHandlingForReservation")
        assert_that(deny_data).is_none()
        self.denied_reservation.refresh_from_db()
        assert_that(self.denied_reservation.state).is_equal_to(STATE_CHOICES.DENIED)
