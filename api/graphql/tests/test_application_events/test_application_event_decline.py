import json

from assertpy import assert_that

from api.graphql.tests.test_application_events.base import (
    ApplicationEventPermissionsTestCaseBase,
)
from applications.models import ApplicationEventStatus, ApplicationStatus


class ApplicationEventDeclineTestCase(ApplicationEventPermissionsTestCaseBase):
    def get_decline_query(self):
        return """
            mutation declineApplicationEvent($input: ApplicationEventDeclineMutationInput!) {
                declineApplicationEvent(input: $input) {
                    status
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_decline_data(self):
        return {
            "pk": self.application_event.pk,
        }

    def test_decline_success_when_admin(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_decline_data()
        assert_that(self.application_event.status).is_equal_to(
            ApplicationEventStatus.CREATED
        )
        response = self.query(self.get_decline_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("declineApplicationEvent")
        assert_that(deny_data.get("errors")).is_none()
        assert_that(deny_data.get("status")).is_equal_to(
            ApplicationEventStatus.DECLINED
        )
        self.application_event.refresh_from_db()
        assert_that(self.application_event.status).is_equal_to(
            ApplicationEventStatus.DECLINED
        )

    def test_decline_success_when_service_sector_admin(self):
        self.client.force_login(self.create_service_sector_admin())
        input_data = self.get_valid_decline_data()
        assert_that(self.application_event.status).is_equal_to(
            ApplicationEventStatus.CREATED
        )
        response = self.query(self.get_decline_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("declineApplicationEvent")
        assert_that(deny_data.get("errors")).is_none()
        assert_that(deny_data.get("status")).is_equal_to(
            ApplicationEventStatus.DECLINED
        )
        self.application_event.refresh_from_db()
        assert_that(self.application_event.status).is_equal_to(
            ApplicationEventStatus.DECLINED
        )

    def test_cant_decline_if_regular_user(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_decline_data()
        assert_that(self.application_event.status).is_equal_to(
            ApplicationEventStatus.CREATED
        )
        response = self.query(self.get_decline_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        deny_data = content.get("data").get("declineApplicationEvent")
        assert_that(deny_data).is_none()
        self.application_event.refresh_from_db()
        assert_that(self.application_event.status).is_equal_to(
            ApplicationEventStatus.CREATED
        )

    def test_cant_decline_if_status_not_in_valid_decline_statuses(self):
        """Current valid statuses when can be declined are; CREATED, APPROVED, FAILED"""
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_decline_data()
        self.application_event.set_status(ApplicationEventStatus.RESERVED)
        self.application_event.save()
        response = self.query(self.get_decline_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.application_event.refresh_from_db()
        assert_that(self.application_event.status).is_equal_to(
            ApplicationEventStatus.RESERVED
        )

    def test_cant_decline_if_application_status_not_valid_decline_statuses(self):
        """Current valid statuses when can be declined are; IN_REVIEW, REVIEW_DONE, ALLOCATED"""
        self.client.force_login(self.general_admin)
        self.application.set_status(ApplicationStatus.RECEIVED)
        input_data = self.get_valid_decline_data()
        assert_that(self.application_event.status).is_equal_to(
            ApplicationEventStatus.CREATED
        )
        response = self.query(self.get_decline_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.application_event.refresh_from_db()
        assert_that(self.application_event.status).is_equal_to(
            ApplicationEventStatus.CREATED
        )
