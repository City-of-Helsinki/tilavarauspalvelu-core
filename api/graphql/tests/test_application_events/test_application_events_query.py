import datetime
import json

from assertpy import assert_that

from api.graphql.tests.test_application_events.base import ApplicationEventTestCaseBase
from applications.models import (
    Application,
    ApplicationEventAggregateData,
    ApplicationEventStatus,
    ApplicationEventWeeklyAmountReduction,
    ApplicationStatus,
)
from applications.tests.factories import (
    ApplicationEventFactory,
    ApplicationEventScheduleResultFactory,
    ApplicationFactory,
    ApplicationStatusFactory,
)
from reservation_units.tests.factories import ReservationUnitFactory


class ApplicationEventQueryTestCase(ApplicationEventTestCaseBase):
    def setUp(self):
        self.client.force_login(self.general_admin)

    def get_query(self, filter_section=None):
        query_to_type = "applicationEvents"
        if filter_section:
            query_to_type = f'{query_to_type}(orderBy: "pk" {filter_section})'
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

    def test_application_shows(self):
        query = """
        {
            applicationEvents {
                edges {
                    node {
                        application
                        {
                            additionalInformation
                        }
                    }
                }
            }
        }
        """
        response = self.query(query)

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

    def test_filter_by_applied_count_lte(self):
        ApplicationEventAggregateData.objects.create(
            application_event=self.application_event, name="duration_total", value=8600
        )
        event = ApplicationEventFactory(name="Don't show me")
        ApplicationEventAggregateData.objects.create(
            application_event=event, name="duration_total", value=9000
        )

        filter_clause = "appliedCountLte: 8601"

        response = self.query(self.get_query(filter_section=filter_clause))
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_filter_by_applied_count_gte(self):
        ApplicationEventAggregateData.objects.create(
            application_event=self.application_event, name="duration_total", value=9000
        )
        event = ApplicationEventFactory(name="Don't show me")
        ApplicationEventAggregateData.objects.create(
            application_event=event, name="duration_total", value=8600
        )

        filter_clause = "appliedCountGte: 8601"

        response = self.query(self.get_query(filter_section=filter_clause))
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_filter_by_applied_count_gte_lte(self):
        ApplicationEventAggregateData.objects.create(
            application_event=self.application_event, name="duration_total", value=8600
        )
        event = ApplicationEventFactory(name="Show me")
        ApplicationEventAggregateData.objects.create(
            application_event=event, name="duration_total", value=9000
        )
        event_too = ApplicationEventFactory(name="Don't show me")
        ApplicationEventAggregateData.objects.create(
            application_event=event_too, name="duration_total", value=9500
        )
        event_too_too = ApplicationEventFactory(name="Don't show me either")
        ApplicationEventAggregateData.objects.create(
            application_event=event_too_too, name="duration_total", value=8000
        )

        filter_clause = "appliedCountGte: 8200 appliedCountLte: 9400"

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

    def test_filter_by_name(self):
        application = ApplicationFactory()
        ApplicationEventFactory(application=application, name="Don't show me!")
        filter_clause = 'name: "Test"'

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
        event.set_status(ApplicationEventStatus.APPROVED)
        filter_clause = f'status: "{ApplicationEventStatus.APPROVED}"'

        response = self.query(self.get_query(filter_section=filter_clause))
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_filter_by_reservation_unit(self):
        self.maxDiff = None
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

    def test_filter_by_applicant_type(self):
        self.maxDiff = None
        application = ApplicationFactory(
            applicant_type=Application.APPLICANT_TYPE_COMMUNITY, user=self.regular_joe
        )
        ApplicationEventFactory(application=application, name="I should be listed")
        filter_clause = f'applicantType: "{Application.APPLICANT_TYPE_COMMUNITY}"'

        response = self.query(self.get_query(filter_section=filter_clause))
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_filter_by_application_status(self):
        application = ApplicationFactory(user=self.regular_joe)
        ApplicationStatusFactory(
            application=application, status=ApplicationStatus.HANDLED
        )
        ApplicationEventFactory(application=application, name="I only should be listed")
        filter_clause = f'applicationStatus: "{ApplicationStatus.HANDLED}"'

        response = self.query(self.get_query(filter_section=filter_clause))
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)

    def test_application_event_reduction_count(self):
        event = ApplicationEventFactory()
        ApplicationEventWeeklyAmountReduction.objects.create(
            application_event=event,
        )
        query = """query {
                        applicationEvents(pk: %s) {
                            edges {
                                node {
                                    weeklyAmountReductionsCount
                                }
                            }
                        }
                    }
                    """ % (
            event.id
        )

        response = self.query(query)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)


class ApplicationEventScheduleResultQueryTestCase(ApplicationEventTestCaseBase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()
        schedule = (
            cls.application.application_events.first().application_event_schedules.first()
        )
        cls.result = ApplicationEventScheduleResultFactory(
            application_event_schedule=schedule,
            allocated_reservation_unit=ReservationUnitFactory(
                name="You got this reservation unit"
            ),
            allocated_duration="02:00",
            allocated_day=0,
            allocated_begin=datetime.time(12, 0),
            allocated_end=datetime.time(14, 0),
        )

    def setUp(self):
        self.client.force_login(self.general_admin)

    def get_query(self):
        return """query {
                applicationEvents {
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
                                applicationEventScheduleResult {
                                    allocatedReservationUnit { nameFi }
                                    accepted
                                    declined
                                    allocatedDay
                                    allocatedBegin
                                    allocatedEnd
                                }
                            }
                        }
                    }
                }
            }
            """

    def test_schedule_results(self):
        response = self.query(self.get_query())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        self.assertMatchSnapshot(content)
