import datetime

import pytest

from tests.factories import ReservationUnitFactory
from tilavarauspalvelu.enums import ReservationUnitPublishingState

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation_unit_state_helper__get_state_with_published():
    reservation_unit = ReservationUnitFactory.create(is_archived=False, is_draft=False)
    assert reservation_unit.publishing_state == ReservationUnitPublishingState.PUBLISHED


def test_reservation_unit_state_helper__get_state_with_archived():
    reservation_unit = ReservationUnitFactory.create(is_archived=True, is_draft=False)
    assert reservation_unit.publishing_state == ReservationUnitPublishingState.ARCHIVED


def test_reservation_unit_state_helper__get_state_with_archived_and_draft():
    reservation_unit = ReservationUnitFactory.create(is_archived=True, is_draft=True)
    assert reservation_unit.publishing_state == ReservationUnitPublishingState.ARCHIVED


def test_reservation_unit_state_helper__get_state_with_draft():
    reservation_unit = ReservationUnitFactory.create(is_archived=False, is_draft=True)
    assert reservation_unit.publishing_state == ReservationUnitPublishingState.DRAFT


def test_reservation_unit_state_helper__get_state_with_scheduled_publishing_and_publish_begins():
    now = datetime.datetime.now(tz=datetime.UTC)
    reservation_unit = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
        publish_begins=now + datetime.timedelta(hours=1),
    )
    assert reservation_unit.publishing_state == ReservationUnitPublishingState.SCHEDULED_PUBLISHING


def test_reservation_unit_state_helper__get_state_with_scheduled_publishing_when_ends_in_past_begins_future():
    now = datetime.datetime.now(tz=datetime.UTC)
    reservation_unit = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
        publish_begins=now + datetime.timedelta(hours=1),
        publish_ends=now - datetime.timedelta(hours=1),
    )
    assert reservation_unit.publishing_state == ReservationUnitPublishingState.SCHEDULED_PUBLISHING


def test_reservation_unit_state_helper__get_state_with_hidden():
    now = datetime.datetime.now(tz=datetime.UTC)
    reservation_unit = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
        publish_begins=now - datetime.timedelta(hours=2),
        publish_ends=now - datetime.timedelta(hours=1),
    )
    assert reservation_unit.publishing_state == ReservationUnitPublishingState.HIDDEN


def test_reservation_unit_state_helper__get_state_with_scheduled_hiding():
    now = datetime.datetime.now(tz=datetime.UTC)
    reservation_unit = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
        publish_begins=now - datetime.timedelta(hours=1),
        publish_ends=now + datetime.timedelta(hours=1),
    )
    assert reservation_unit.publishing_state == ReservationUnitPublishingState.SCHEDULED_HIDING


def test_reservation_unit_state_helper__get_state_with_scheduled_period():
    now = datetime.datetime.now(tz=datetime.UTC)
    reservation_unit = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
        publish_begins=now + datetime.timedelta(hours=1),
        publish_ends=now + datetime.timedelta(days=1),
    )
    assert reservation_unit.publishing_state == ReservationUnitPublishingState.SCHEDULED_PERIOD


def test_reservation_unit_state_helper__state_is_hidden_when_publish_end_and_begins_in_the_past_and_the_same():
    now = datetime.datetime.now(tz=datetime.UTC)
    reservation_unit = ReservationUnitFactory.create(
        is_archived=False,
        is_draft=False,
        publish_begins=now - datetime.timedelta(hours=1),
        publish_ends=now - datetime.timedelta(hours=1),
    )
    assert reservation_unit.publishing_state == ReservationUnitPublishingState.HIDDEN
