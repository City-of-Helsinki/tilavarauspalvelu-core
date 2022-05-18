import json

from assertpy import assert_that

from applications.models import Application, ApplicationStatus
from applications.tests.factories import ApplicationFactory, ApplicationStatusFactory

from .base import ApplicationTestCaseBase


class ApplicationsGraphQLFiltersTestCase(ApplicationTestCaseBase):
    def setUp(self):
        super().setUp()

        self.client.force_login(self.general_admin)

        # This application should not be in any of the test queries
        application = ApplicationFactory(
            applicant_type=Application.APPLICANT_TYPE_ASSOCIATION
        )

        ApplicationStatusFactory(
            application=application,
            status=ApplicationStatus.DRAFT,
        )

    def test_application_filter_by_application_round(self):
        query = f"""
            query {{
                applications(applicationRound: {self.application.application_round.id}) {{
                    edges {{
                        node {{
                            applicantType
                            createdDate
                            lastModifiedDate
                            additionalInformation
                        }}
                    }}
                }}
            }}
        """

        response = self.query(query)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_filter_by_status(self):
        query = f"""
            query {{
                applications(status: "{self.application.status}") {{
                    edges {{
                        node {{
                            applicantType
                            createdDate
                            lastModifiedDate
                            additionalInformation
                        }}
                    }}
                }}
            }}
        """

        response = self.query(query)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_filter_by_unit(self):
        unit = self.event_reservation_unit.reservation_unit.unit
        query = f"""
            query {{
                applications(unit: "{unit.id}") {{
                    edges {{
                        node {{
                            applicantType
                            createdDate
                            lastModifiedDate
                            additionalInformation
                        }}
                    }}
                }}
            }}
        """

        response = self.query(query)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_application_filter_by_user(self):
        query = f"""
            query {{
                applications(user: "{self.regular_joe.id}") {{
                    edges {{
                        node {{
                            applicantType
                            createdDate
                            lastModifiedDate
                            additionalInformation
                        }}
                    }}
                }}
            }}
        """

        response = self.query(query)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
