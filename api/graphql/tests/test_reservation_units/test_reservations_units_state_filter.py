import datetime
import json

from assertpy import assert_that
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitQueryTestCaseBase,
)
from reservation_units.tests.factories import ReservationUnitFactory


class ReservationUnitsFilterStateTestCase(ReservationUnitQueryTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        now = datetime.datetime.now(tz=get_default_timezone())
        cls.archived_reservation_unit = ReservationUnitFactory(
            name="I am archived!", is_archived=True
        )
        cls.archived_reservation_unit = ReservationUnitFactory(
            name="I am a draft!", is_archived=False, is_draft=True
        )
        cls.scheduled_publishing_reservation_unit_1 = ReservationUnitFactory(
            name="I am scheduled for publishing!",
            is_archived=False,
            is_draft=False,
            publish_begins=(now + datetime.timedelta(hours=1)),
        )
        cls.scheduled_publishing_reservation_unit_2 = ReservationUnitFactory(
            name="I am also scheduled for publishing!",
            is_archived=False,
            is_draft=False,
            publish_ends=(now - datetime.timedelta(hours=1)),
        )
        cls.scheduled_reservation_reservation_unit_1 = ReservationUnitFactory(
            name="I am scheduled for reservation!",
            is_archived=False,
            is_draft=False,
            reservation_begins=(now + datetime.timedelta(hours=1)),
        )
        cls.scheduled_reservation_reservation_unit_2 = ReservationUnitFactory(
            name="I am also scheduled for reservation!",
            is_archived=False,
            is_draft=False,
            reservation_ends=(now - datetime.timedelta(hours=1)),
        )
        cls.published_reservation_unit = ReservationUnitFactory(
            name="Yey! I'm published!",
            is_archived=False,
            is_draft=False,
        )

    # Archived reservation units are always hidden
    def test_filtering_by_archived_returns_nothing(self):
        response = self.query(
            """
            query {
                reservationUnits(state:"ARCHIVED"){
                    edges {
                        node {
                            nameFi
                            state
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_true()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_draft(self):
        response = self.query(
            """
            query {
                reservationUnits(state:"DRAFT"){
                    edges {
                        node {
                            nameFi
                            state
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_scheduled_publishing(self):
        response = self.query(
            """
            query {
                reservationUnits(state:"SCHEDULED_PUBLISHING"){
                    edges {
                        node {
                            nameFi
                            state
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_scheduled_reservation(self):
        response = self.query(
            """
            query {
                reservationUnits(state:"SCHEDULED_RESERVATION"){
                    edges {
                        node {
                            nameFi
                            state
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_published(self):
        response = self.query(
            """
            query {
                reservationUnits(state:"PUBLISHED"){
                    edges {
                        node {
                            nameFi
                            state
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_mixed(self):
        response = self.query(
            """
            query {
                reservationUnits(state:["DRAFT", "SCHEDULED_PUBLISHING"]){
                    edges {
                        node {
                            nameFi
                            state
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
