import json

from assertpy import assert_that
from django.contrib.auth import get_user_model

from api.graphql.tests.test_application_events.base import (
    ApplicationEventPermissionsTestCaseBase,
)
from applications.models import ApplicationEvent, ApplicationEventStatus
from applications.tests.factories import ApplicationEventFactory


class ApplicationEventDeleteTestCase(ApplicationEventPermissionsTestCaseBase):
    def setUp(self):
        self.application_event = ApplicationEventFactory(application=self.application)
        self.application_event.set_status(ApplicationEventStatus.CREATED)

    def get_delete_query(self):
        return """
            mutation deleteApplicationEvent($input: ApplicationEventDeleteMutationInput!) {
                deleteApplicationEvent(input: $input){
                    deleted
                    errors
                }
            }
        """

    def get_delete_input_data(self):
        return {"pk": self.application_event.id}

    def test_general_admin_can_delete(self):
        self.client.force_login(self.general_admin)

        response = self.query(
            self.get_delete_query(), input_data=self.get_delete_input_data()
        )
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("deleteApplicationEvent").get("errors")
        ).is_none()
        assert_that(
            content.get("data").get("deleteApplicationEvent").get("deleted")
        ).is_true()

        assert_that(
            ApplicationEvent.objects.filter(pk=self.application_event.pk).exists()
        ).is_false()

    def test_user_can_delete(self):
        self.client.force_login(self.regular_joe)

        response = self.query(
            self.get_delete_query(), input_data=self.get_delete_input_data()
        )
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("deleteApplicationEvent").get("errors")
        ).is_none()
        assert_that(
            content.get("data").get("deleteApplicationEvent").get("deleted")
        ).is_true()

        assert_that(
            ApplicationEvent.objects.filter(pk=self.application_event.pk).exists()
        ).is_false()

    def test_cannot_delete_when_status_not_created(self):
        self.client.force_login(self.general_admin)

        self.application_event.set_status(ApplicationEventStatus.DECLINED)
        response = self.query(
            self.get_delete_query(), input_data=self.get_delete_input_data()
        )
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        assert_that(
            ApplicationEvent.objects.filter(pk=self.application_event.pk).exists()
        ).is_true()

    def test_other_user_cannot_delete(self):
        other_guy = get_user_model().objects.create(
            username="other",
            first_name="oth",
            last_name="er",
            email="oth.er@foo.com",
        )
        self.client.force_login(other_guy)

        response = self.query(
            self.get_delete_query(), input_data=self.get_delete_input_data()
        )
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        assert_that(
            ApplicationEvent.objects.filter(pk=self.application_event.pk).exists()
        ).is_true()
