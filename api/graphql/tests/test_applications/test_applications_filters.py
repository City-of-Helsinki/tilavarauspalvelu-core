import json

import freezegun
from assertpy import assert_that
from django.contrib.auth import get_user_model

from applications.models import Application, ApplicationStatus
from applications.tests.factories import (
    ApplicationFactory,
    ApplicationStatusFactory,
    OrganisationFactory,
    PersonFactory,
)

from .base import ApplicationTestCaseBase


@freezegun.freeze_time("2022-05-02T12:00:00Z")
class ApplicationsGraphQLFiltersTestCase(ApplicationTestCaseBase):
    def setUp(self):
        super().setUp()

        self.client.force_login(self.general_admin)

        zzz_user = get_user_model().objects.create(
            username="zzzuser",
            first_name="Zzz",
            last_name="tester",
            email="zzz.tester@foo.com",
        )

        # This application should not be in any of the test queries
        application = ApplicationFactory(
            applicant_type=Application.APPLICANT_TYPE_ASSOCIATION,
            additional_information="Not visible in filter queries but visible in order by",
            contact_person=None,
            organisation=None,
            user=zzz_user,
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

    def test_order_by_pk_asc(self):
        application_1 = ApplicationFactory(additional_information="Test application 1")
        application_2 = ApplicationFactory(additional_information="Test application 2")

        application_1.status = ApplicationStatus.IN_REVIEW
        application_2.status = ApplicationStatus.IN_REVIEW

        application_1.save()
        application_2.save()

        query = """
            query {
                applications(orderBy: "pk") {
                    edges {
                        node {
                            additionalInformation
                        }
                    }
                }
            }
        """

        response = self.query(query)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_pk_desc(self):
        application_1 = ApplicationFactory(additional_information="Test application 1")
        application_2 = ApplicationFactory(additional_information="Test application 2")

        application_1.status = ApplicationStatus.IN_REVIEW
        application_2.status = ApplicationStatus.IN_REVIEW

        application_1.save()
        application_2.save()

        query = """
            query {
                applications(orderBy: "-pk") {
                    edges {
                        node {
                            additionalInformation
                        }
                    }
                }
            }
        """

        response = self.query(query)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_applicant_asc(self):
        bbb_user = get_user_model().objects.create(
            username="bbbuser",
            first_name="Bbb",
            last_name="tester",
            email="bbb.tester@foo.com",
        )
        ccc_person = PersonFactory(
            first_name="Ccc",
            last_name="tester",
        )
        application_1 = ApplicationFactory(
            additional_information="Test application 1",
            contact_person=None,
            organisation=None,
            user=bbb_user,
        )
        application_2 = ApplicationFactory(
            additional_information="Test application 2",
            contact_person=ccc_person,
            organisation=None,
            user=bbb_user,
        )
        application_3 = ApplicationFactory(
            additional_information="Test application 3",
            contact_person=None,
            organisation=OrganisationFactory(name="AAA Organisation"),
            user=bbb_user,
        )

        application_1.status = ApplicationStatus.IN_REVIEW
        application_2.status = ApplicationStatus.IN_REVIEW
        application_3.status = ApplicationStatus.IN_REVIEW

        query = """
            query {
                applications(orderBy: "applicant") {
                    edges {
                        node {
                            additionalInformation
                        }
                    }
                }
            }
        """

        response = self.query(query)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_applicant_desc(self):
        bbb_user = get_user_model().objects.create(
            username="bbbuser",
            first_name="Bbb",
            last_name="tester",
            email="bbb.tester@foo.com",
        )
        ccc_person = PersonFactory(
            first_name="Ccc",
            last_name="tester",
        )
        application_1 = ApplicationFactory(
            additional_information="Test application 1",
            contact_person=None,
            organisation=None,
            user=bbb_user,
        )
        application_2 = ApplicationFactory(
            additional_information="Test application 2",
            contact_person=ccc_person,
            organisation=None,
            user=bbb_user,
        )
        application_3 = ApplicationFactory(
            additional_information="Test application 3",
            contact_person=None,
            organisation=OrganisationFactory(name="AAA Organisation"),
            user=bbb_user,
        )

        application_1.status = ApplicationStatus.IN_REVIEW
        application_2.status = ApplicationStatus.IN_REVIEW
        application_3.status = ApplicationStatus.IN_REVIEW

        query = """
            query {
                applications(orderBy: "-applicant") {
                    edges {
                        node {
                            additionalInformation
                        }
                    }
                }
            }
        """

        response = self.query(query)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_applicant(self):
        query = (
            """
            query {
                applications(applicantType: "%s") {
                    edges {
                        node {
                            additionalInformation
                        }
                    }
                }
            }
        """
            % Application.APPLICANT_TYPE_COMMUNITY.upper()
        )

        ApplicationFactory(
            applicant_type=Application.APPLICANT_TYPE_COMPANY, user=self.regular_joe
        )
        response = self.query(query)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
