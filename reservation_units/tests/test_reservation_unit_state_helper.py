import datetime

from django.test.testcases import TestCase

from reservation_units.enums import ReservationUnitState
from reservation_units.models import ReservationUnit
from reservation_units.utils.reservation_unit_state_helper import (
    ReservationUnitStateHelper as Helper,
)
from tests.factories import ReservationUnitFactory


class ReservationUnitStateHelperTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.reservation_unit: ReservationUnit = ReservationUnitFactory()
        cls.now = datetime.datetime.now(tz=datetime.UTC)

    def test_get_state_with_archived(self):
        self.reservation_unit.is_archived = True
        assert Helper.get_state(self.reservation_unit) == ReservationUnitState.ARCHIVED

    def test_get_state_with_archived_and_draft(self):
        self.reservation_unit.is_archived = True
        self.reservation_unit.is_draft = True
        assert Helper.get_state(self.reservation_unit) == ReservationUnitState.ARCHIVED

    def test_get_state_with_draft(self):
        self.reservation_unit.is_archived = False
        self.reservation_unit.is_draft = True
        assert Helper.get_state(self.reservation_unit) == ReservationUnitState.DRAFT

    def test_get_state_with_scheduled_publishing_and_publish_begins(self):
        one_hour = datetime.timedelta(hours=1)
        self.reservation_unit.is_archived = False
        self.reservation_unit.is_draft = False
        self.reservation_unit.publish_begins = self.now + one_hour
        assert Helper.get_state(self.reservation_unit) == ReservationUnitState.SCHEDULED_PUBLISHING

    def test_get_state_with_scheduled_publishing_when_ends_in_past_begins_future(self):
        one_hour = datetime.timedelta(hours=1)
        self.reservation_unit.is_archived = False
        self.reservation_unit.is_draft = False
        self.reservation_unit.publish_begins = self.now + one_hour
        self.reservation_unit.publish_ends = self.now - one_hour
        assert Helper.get_state(self.reservation_unit) == ReservationUnitState.SCHEDULED_PUBLISHING

    def test_get_state_with_published(self):
        self.reservation_unit.is_archived = False
        self.reservation_unit.is_draft = False
        assert Helper.get_state(self.reservation_unit) == ReservationUnitState.PUBLISHED

    def test_get_state_with_hidden(self):
        self.reservation_unit.is_archived = False
        self.reservation_unit.is_draft = False
        self.reservation_unit.publish_begins = self.now - datetime.timedelta(hours=2)
        self.reservation_unit.publish_ends = self.now - datetime.timedelta(hours=1)
        assert Helper.get_state(self.reservation_unit) == ReservationUnitState.HIDDEN

    def test_get_state_with_scheduled_hiding(self):
        self.reservation_unit.is_archived = False
        self.reservation_unit.is_draft = False
        self.reservation_unit.publish_begins = self.now - datetime.timedelta(hours=1)
        self.reservation_unit.publish_ends = self.now + datetime.timedelta(hours=1)
        assert Helper.get_state(self.reservation_unit) == ReservationUnitState.SCHEDULED_HIDING

    def test_get_state_with_scheduled_period(self):
        self.reservation_unit.is_archived = False
        self.reservation_unit.is_draft = False
        self.reservation_unit.publish_begins = self.now + datetime.timedelta(hours=1)
        self.reservation_unit.publish_ends = self.now + datetime.timedelta(days=1)
        assert Helper.get_state(self.reservation_unit) == ReservationUnitState.SCHEDULED_PERIOD

    def test_state_is_hidden_when_publish_end_and_begins_in_the_past_and_the_same(self):
        self.reservation_unit.is_archived = False
        self.reservation_unit.is_draft = False
        self.reservation_unit.publish_begins = self.now - datetime.timedelta(hours=1)
        self.reservation_unit.publish_ends = self.reservation_unit.publish_begins
        assert Helper.get_state(self.reservation_unit) == ReservationUnitState.HIDDEN
