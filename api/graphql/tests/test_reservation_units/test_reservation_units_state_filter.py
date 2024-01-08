import datetime
import json

from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitQueryTestCaseBase,
)
from api.graphql.tests.test_reservation_units.conftest import reservation_units_query
from tests.factories import ReservationUnitFactory


class ReservationUnitsFilterStateTestCase(ReservationUnitQueryTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        now = datetime.datetime.now(tz=get_default_timezone())
        cls.archived_reservation_unit = ReservationUnitFactory(name="I am archived!", is_archived=True)
        cls.archived_reservation_unit = ReservationUnitFactory(name="I am a draft!", is_archived=False, is_draft=True)
        cls.scheduled_publishing_reservation_unit = ReservationUnitFactory(
            name="I am scheduled for publishing!",
            is_archived=False,
            is_draft=False,
            publish_begins=(now + datetime.timedelta(hours=1)),
        )
        cls.published_reservation_unit = ReservationUnitFactory(
            name="Yey! I'm published!",
            is_archived=False,
            is_draft=False,
        )
        cls.scheduled_period = ReservationUnitFactory(
            name="I am scheduled period",
            is_archived=False,
            is_draft=False,
            publish_begins=(now + datetime.timedelta(days=1)),
            publish_ends=(now + datetime.timedelta(days=2)),
        )
        cls.scheduled_hiding = ReservationUnitFactory(
            name="I am scheduled hiding",
            is_archived=False,
            is_draft=False,
            publish_begins=(now - datetime.timedelta(days=1)),
            publish_ends=(now + datetime.timedelta(days=1)),
        )
        cls.hidden = ReservationUnitFactory(
            name="I am hidden",
            is_archived=False,
            is_draft=False,
            publish_begins=(now - datetime.timedelta(days=2)),
            publish_ends=(now - datetime.timedelta(days=1)),
        )

    # Archived reservation units are always hidden
    def test_filtering_by_archived_returns_nothing(self):
        response = self.query(
            reservation_units_query(
                state="ARCHIVED",
                fields="nameFi state",
            )
        )

        content = json.loads(response.content)
        assert self.content_is_empty(content)
        assert content.get("errors") is None
        self.assertMatchSnapshot(content)

    def test_filtering_by_draft(self):
        response = self.query(
            reservation_units_query(
                state="DRAFT",
                fields="nameFi state",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        self.assertMatchSnapshot(content)

    def test_filtering_by_scheduled_publishing(self):
        response = self.query(
            reservation_units_query(
                state="SCHEDULED_PUBLISHING",
                fields="nameFi state",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        self.assertMatchSnapshot(content)

    def test_filtering_by_published(self):
        response = self.query(
            reservation_units_query(
                state="PUBLISHED",
                fields="nameFi state",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        self.assertMatchSnapshot(content)

    def test_filtering_by_mixed(self):
        response = self.query(
            reservation_units_query(
                state=["DRAFT", "SCHEDULED_PUBLISHING"],
                fields="nameFi state",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        self.assertMatchSnapshot(content)

    def test_filtering_by_scheduled_period(self):
        response = self.query(
            reservation_units_query(
                state="SCHEDULED_PERIOD",
                fields="nameFi state",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        self.assertMatchSnapshot(content)

    def test_filtering_by_scheduled_hiding(self):
        response = self.query(
            reservation_units_query(
                state="SCHEDULED_HIDING",
                fields="nameFi state",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        self.assertMatchSnapshot(content)

    def test_filtering_by_hidden(self):
        response = self.query(
            reservation_units_query(
                state="HIDDEN",
                fields="nameFi state",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        self.assertMatchSnapshot(content)

    def test_filtering_by_scheduled_publishing_when_begin_after_end(self):
        now = datetime.datetime.now(tz=get_default_timezone())

        ReservationUnitFactory(
            name="I'm scheduled for publishing and my begins is after end.",
            is_archived=False,
            is_draft=False,
            publish_begins=(now + datetime.timedelta(days=2)),
            publish_ends=(now + datetime.timedelta(days=1)),
        )
        response = self.query(
            reservation_units_query(
                state="SCHEDULED_PUBLISHING",
                fields="nameFi state",
            )
        )

        content = json.loads(response.content)
        assert not self.content_is_empty(content)
        assert content.get("errors") is None
        self.assertMatchSnapshot(content)
