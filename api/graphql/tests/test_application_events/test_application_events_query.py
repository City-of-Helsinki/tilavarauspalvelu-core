import json

from assertpy import assert_that

from api.graphql.tests.test_application_events.base import ApplicationEventTestCaseBase
from applications.models import ApplicationEventStatus
from applications.tests.factories import ApplicationEventFactory, ApplicationFactory


class ApplicationEventQueryTestCase(ApplicationEventTestCaseBase):
    def setUp(self):
        self.client.force_login(self.general_admin)

    def get_query(self, filter_section=None):
        query_to_type = "applicationEvents"
        if filter_section:
            query_to_type = f"{query_to_type}({filter_section})"
        return (
            "query { %s {" % query_to_type
            + """
                    edges {
                        node {
                            name
                            numPersons
                            status
                            applicationEventSchedules {
                                day
                                begin
                                end
                                priority
                            }
                            eventReservationUnits {
                                reservationUnit {
                                    nameFi
                                    reservationUnitType {
                                        nameFi
                                    }
                                    unit {
                                        nameFi
                                    }
                                    resources { nameFi}
                                }
                            }
                        }
                    }
                }
            }
            """
        )

    def test_query_ok(self):
        response = self.query(self.get_query())

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_filter_by_pk(self):
        event = ApplicationEventFactory(
            application=self.application, name="Show only me"
        )
        filter_clause = f"pk: {event.id}"

        response = self.query(self.get_query(filter_section=filter_clause))
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_filter_by_application(self):
        application = ApplicationFactory()
        ApplicationEventFactory(application=application, name="I should be only event")
        filter_clause = f"application: {application.id}"

        response = self.query(self.get_query(filter_section=filter_clause))
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_filter_by_application_round(self):
        application = ApplicationFactory()
        ApplicationEventFactory(application=application, name="I should be only event")
        filter_clause = f"applicationRound: {application.application_round.id}"

        response = self.query(self.get_query(filter_section=filter_clause))
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_filter_by_unit(self):
        application = ApplicationFactory()
        ApplicationEventFactory(application=application, name="I shouldn't be listed")
        filter_clause = f"unit: {self.event_reservation_unit.reservation_unit.unit.id}"

        response = self.query(self.get_query(filter_section=filter_clause))
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_filter_by_status(self):
        event = ApplicationEventFactory(
            application=self.application, name="Only I should be listed"
        )
        event.set_status(ApplicationEventStatus.VALIDATED)
        filter_clause = f'status: "{ApplicationEventStatus.VALIDATED}"'

        response = self.query(self.get_query(filter_section=filter_clause))
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_filter_by_reservation_unit(self):
        application = ApplicationFactory()
        ApplicationEventFactory(application=application, name="I shouldn't be listed")
        filter_clause = (
            f"reservationUnit: {self.event_reservation_unit.reservation_unit.id}"
        )

        response = self.query(self.get_query(filter_section=filter_clause))
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_filter_by_user(self):
        application = ApplicationFactory()
        ApplicationEventFactory(application=application, name="I shouldn't be listed")
        filter_clause = f"user: {self.application.user.id}"

        response = self.query(self.get_query(filter_section=filter_clause))
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)
