import json

from assertpy import assert_that

from api.graphql.tests.test_application_events.base import (
    ApplicationEventPermissionsTestCaseBase,
)
from applications.models import ApplicationStatus
from applications.tests.factories import (
    ApplicationEventFactory,
    ApplicationFactory,
    ApplicationStatusFactory,
    EventReservationUnitFactory,
)
from reservation_units.tests.factories import ReservationUnitFactory


class FlaggedTestCaseBase(ApplicationEventPermissionsTestCaseBase):
    @classmethod
    def setUpTestData(cls) -> None:
        super().setUpTestData()

        cls.draft_application = ApplicationFactory()
        ApplicationStatusFactory(status=ApplicationStatus.DRAFT, application=cls.draft_application)
        cls.draft_app_event = ApplicationEventFactory(application=cls.draft_application)

        cls.sent_application = ApplicationFactory()
        ApplicationStatusFactory(status=ApplicationStatus.SENT, application=cls.sent_application)
        cls.sent_app_event = ApplicationEventFactory(application=cls.sent_application)

        cls.allocated_application = ApplicationFactory()
        ApplicationStatusFactory(status=ApplicationStatus.ALLOCATED, application=cls.allocated_application)
        cls.allocated_app_event = ApplicationEventFactory(application=cls.allocated_application)


class ApplicationEventFlaggedTestCase(FlaggedTestCaseBase):
    def get_flag_query(self):
        return """
            mutation flagApplicationEvent($input: ApplicationEventFlagMutationInput!) {
                flagApplicationEvent(input: $input){
                    pk
                    flagged
                    errors {
                        messages field
                    }
                }
            }
        """

    def test_set_flagged_succeeds(self):
        self.client.force_login(self.general_admin)
        data = {"flagged": True, "pk": self.allocated_app_event.id}

        response = self.query(self.get_flag_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        app_event_data = content.get("data").get("flagApplicationEvent")
        assert_that(app_event_data.get("errors")).is_none()
        self.allocated_app_event.refresh_from_db()
        assert_that(self.allocated_app_event.flagged).is_equal_to(data["flagged"])

    def test_set_flagged_fails_when_application_status_not_valid(self):
        self.client.force_login(self.general_admin)
        data = {"flagged": True, "pk": self.draft_app_event.id}

        response = self.query(self.get_flag_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).contains("Only application with status as")

        self.draft_app_event.refresh_from_db()
        assert_that(self.draft_app_event.flagged).is_false()

    def test_sent_application_flag_to_false_success(self):
        self.client.force_login(self.general_admin)
        self.sent_app_event.flagged = True
        self.sent_app_event.save()
        data = {"flagged": False, "pk": self.sent_app_event.id}

        response = self.query(self.get_flag_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        app_event_data = content.get("data").get("flagApplicationEvent")
        assert_that(app_event_data.get("errors")).is_none()
        self.sent_app_event.refresh_from_db()
        assert_that(self.sent_app_event.flagged).is_equal_to(data["flagged"])

    def test_sent_application_flag_to_true_fails(self):
        self.client.force_login(self.general_admin)
        data = {"flagged": True, "pk": self.sent_app_event.id}

        response = self.query(self.get_flag_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).contains(
            "Application status is send. Only setting the flagged to False is possible."
        )

        self.sent_app_event.refresh_from_db()
        assert_that(self.sent_app_event.flagged).is_false()

    def test_service_sector_admin_can_flag(self):
        ss_admin = self.create_service_sector_admin(
            service_sector=self.allocated_app_event.application.application_round.service_sector
        )
        self.client.force_login(ss_admin)
        data = {"flagged": True, "pk": self.allocated_app_event.id}

        response = self.query(self.get_flag_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        app_event_data = content.get("data").get("flagApplicationEvent")
        assert_that(app_event_data.get("errors")).is_none()
        self.allocated_app_event.refresh_from_db()
        assert_that(self.allocated_app_event.flagged).is_equal_to(data["flagged"])

    def test_unit_admin_cant_flag(self):
        res_unit = ReservationUnitFactory()
        EventReservationUnitFactory(application_event=self.allocated_app_event)
        unit_admin = self.create_unit_admin(res_unit.unit)
        self.client.force_login(unit_admin)
        data = {"flagged": True, "pk": self.allocated_app_event.id}

        response = self.query(self.get_flag_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to("No permission to mutate")

    def test_regular_user_cant_flag(self):
        self.client.force_login(self.regular_joe)
        data = {"flagged": True, "pk": self.allocated_app_event.id}

        response = self.query(self.get_flag_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to("No permission to mutate")


class ApplicationFlaggedTestCase(FlaggedTestCaseBase):
    def get_flag_query(self):
        return """
            mutation flagApplication($input: ApplicationFlagMutationInput!) {
                flagApplication(input: $input){
                    pk
                    errors {
                        messages field
                    }
                }
            }
        """

    def test_set_flagged_succeeds(self):
        self.client.force_login(self.general_admin)
        data = {"flagged": True, "pk": self.allocated_application.id}

        response = self.query(self.get_flag_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        app_event_data = content.get("data").get("flagApplication")
        assert_that(app_event_data.get("errors")).is_none()
        self.allocated_app_event.refresh_from_db()
        assert_that(self.allocated_app_event.flagged).is_equal_to(data["flagged"])

    def test_set_flagged_fails_when_application_status_not_valid(self):
        self.client.force_login(self.general_admin)
        data = {"flagged": True, "pk": self.draft_application.id}

        response = self.query(self.get_flag_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).contains("Only application with status as")

        self.draft_app_event.refresh_from_db()
        assert_that(self.draft_app_event.flagged).is_false()

    def test_sent_application_flag_to_false_success(self):
        self.client.force_login(self.general_admin)
        self.sent_app_event.flagged = True
        self.sent_app_event.save()
        data = {"flagged": False, "pk": self.sent_application.id}

        response = self.query(self.get_flag_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        app_event_data = content.get("data").get("flagApplication")
        assert_that(app_event_data.get("errors")).is_none()
        self.sent_app_event.refresh_from_db()
        assert_that(self.sent_app_event.flagged).is_equal_to(data["flagged"])

    def test_sent_application_flag_to_true_fails(self):
        self.client.force_login(self.general_admin)
        data = {"flagged": True, "pk": self.sent_application.id}

        response = self.query(self.get_flag_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).contains(
            "Application status is send. Only setting the flagged to False is possible."
        )

        self.sent_app_event.refresh_from_db()
        assert_that(self.sent_app_event.flagged).is_false()

    def test_service_sector_admin_can_flag(self):
        ss_admin = self.create_service_sector_admin(
            service_sector=self.allocated_application.application_round.service_sector
        )
        self.client.force_login(ss_admin)
        data = {"flagged": True, "pk": self.allocated_application.id}

        response = self.query(self.get_flag_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        app_event_data = content.get("data").get("flagApplication")
        assert_that(app_event_data.get("errors")).is_none()
        self.allocated_app_event.refresh_from_db()
        assert_that(self.allocated_app_event.flagged).is_equal_to(data["flagged"])

    def test_unit_admin_cant_flag(self):
        res_unit = ReservationUnitFactory()
        EventReservationUnitFactory(application_event=self.allocated_app_event)
        unit_admin = self.create_unit_admin(res_unit.unit)
        self.client.force_login(unit_admin)
        data = {"flagged": True, "pk": self.allocated_application.id}

        response = self.query(self.get_flag_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to("No permission to mutate")

    def test_regular_user_cant_flag(self):
        self.client.force_login(self.regular_joe)
        data = {"flagged": True, "pk": self.allocated_application.id}

        response = self.query(self.get_flag_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to("No permission to mutate")
