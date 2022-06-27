import datetime

from assertpy import assert_that
from django.test.testcases import TestCase

from reservation_units.enums import ReservationUnitState
from reservation_units.models import ReservationUnit
from reservation_units.tests.factories import ReservationUnitFactory
from reservation_units.utils.reservation_unit_state_helper import (
    ReservationUnitStateHelper as Helper,
)


class ReservationUnitStateHelperTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.reservation_unit: ReservationUnit = ReservationUnitFactory()
        cls.now = datetime.datetime.now(tz=datetime.timezone.utc)

    def test_get_state_with_archived(self):
        self.reservation_unit.is_archived = True
        assert_that(Helper.get_state(self.reservation_unit)).is_equal_to(
            ReservationUnitState.ARCHIVED
        )

    def test_get_state_with_archived_and_draft(self):
        self.reservation_unit.is_archived = True
        self.reservation_unit.is_draft = True
        assert_that(Helper.get_state(self.reservation_unit)).is_equal_to(
            ReservationUnitState.ARCHIVED
        )

    def test_get_state_with_draft(self):
        self.reservation_unit.is_archived = False
        self.reservation_unit.is_draft = True
        assert_that(Helper.get_state(self.reservation_unit)).is_equal_to(
            ReservationUnitState.DRAFT
        )

    def test_get_state_with_scheduled_publishing_and_publish_begins(self):
        one_hour = datetime.timedelta(hours=1)
        self.reservation_unit.is_archived = False
        self.reservation_unit.is_draft = False
        self.reservation_unit.publish_begins = self.now + one_hour
        assert_that(Helper.get_state(self.reservation_unit)).is_equal_to(
            ReservationUnitState.SCHEDULED_PUBLISHING
        )

    def test_get_state_with_scheduled_publishing_and_publish_end(self):
        one_hour = datetime.timedelta(hours=1)
        self.reservation_unit.is_archived = False
        self.reservation_unit.is_draft = False
        self.reservation_unit.publish_ends = self.now - one_hour
        assert_that(Helper.get_state(self.reservation_unit)).is_equal_to(
            ReservationUnitState.SCHEDULED_PUBLISHING
        )

    def test_get_state_with_scheduled_reservation_and_reservation_begins(self):
        one_hour = datetime.timedelta(hours=1)
        self.reservation_unit.is_archived = False
        self.reservation_unit.is_draft = False
        self.reservation_unit.reservation_begins = self.now + one_hour
        assert_that(Helper.get_state(self.reservation_unit)).is_equal_to(
            ReservationUnitState.SCHEDULED_RESERVATION
        )

    def test_get_state_with_scheduled_reservation_and_reservation_ends(self):
        one_hour = datetime.timedelta(hours=1)
        self.reservation_unit.is_archived = False
        self.reservation_unit.is_draft = False
        self.reservation_unit.reservation_ends = self.now - one_hour
        assert_that(Helper.get_state(self.reservation_unit)).is_equal_to(
            ReservationUnitState.SCHEDULED_RESERVATION
        )

    def test_get_state_with_published(self):
        self.reservation_unit.is_archived = False
        self.reservation_unit.is_draft = False
        assert_that(Helper.get_state(self.reservation_unit)).is_equal_to(
            ReservationUnitState.PUBLISHED
        )
