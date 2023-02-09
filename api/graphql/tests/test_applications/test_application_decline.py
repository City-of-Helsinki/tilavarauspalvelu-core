import json

from assertpy import assert_that

from api.graphql.tests.test_applications.base import ApplicationTestCaseBase
from applications.models import ApplicationEventStatus, ApplicationStatus


class ApplicationDeclineTestCase(ApplicationTestCaseBase):
    def get_decline_query(self):
        return """
            mutation declineApplication($input: ApplicationDeclineMutationInput!) {
                declineApplication(input: $input) {
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_decline_data(self):
        return {
            "pk": self.application.pk,
        }

    def test_decline_success_when_admin(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_decline_data()

        for event in self.application.application_events.all():
            assert_that(event.status).is_equal_to(ApplicationEventStatus.CREATED)
        response = self.query(self.get_decline_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("declineApplication")
        assert_that(deny_data.get("errors")).is_none()

        for event in self.application.application_events.all():
            assert_that(event.status).is_equal_to(ApplicationEventStatus.DECLINED)

    def test_decline_success_when_service_sector_admin(self):
        self.client.force_login(self.create_service_sector_admin())
        input_data = self.get_valid_decline_data()

        for event in self.application.application_events.all():
            assert_that(event.status).is_equal_to(ApplicationEventStatus.CREATED)

        response = self.query(self.get_decline_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("declineApplication")
        assert_that(deny_data.get("errors")).is_none()
        for event in self.application.application_events.all():
            assert_that(event.status).is_equal_to(ApplicationEventStatus.DECLINED)

    def test_cant_decline_if_regular_user(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_decline_data()

        for event in self.application.application_events.all():
            assert_that(event.status).is_equal_to(ApplicationEventStatus.CREATED)

        response = self.query(self.get_decline_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        deny_data = content.get("data").get("declineApplication")
        assert_that(deny_data).is_none()

        for event in self.application.application_events.all():
            assert_that(event.status).is_equal_to(ApplicationEventStatus.CREATED)

    def test_cant_decline_if_status_not_in_valid_decline_statuses(self):
        """Current valid statuses when can be declined are; IN_REVIEW, REVIEW_DONE, ALLOCATED"""
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_decline_data()

        for event in self.application.application_events.all():
            assert_that(event.status).is_equal_to(ApplicationEventStatus.CREATED)

        self.application.set_status(ApplicationStatus.HANDLED)

        response = self.query(self.get_decline_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        for event in self.application.application_events.all():
            assert_that(event.status).is_equal_to(ApplicationEventStatus.CREATED)
