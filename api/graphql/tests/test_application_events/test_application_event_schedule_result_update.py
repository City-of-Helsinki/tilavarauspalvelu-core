import datetime
import json

from assertpy import assert_that
from django.contrib.auth import get_user_model

from api.graphql.tests.test_application_events.base import (
    ApplicationEventPermissionsTestCaseBase,
)
from applications.tests.factories import (
    ApplicationEventScheduleResultFactory,
    ApplicationFactory,
)
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import (
    AbilityGroupFactory,
    AgeGroupFactory,
    ReservationPurposeFactory,
)
from spaces.tests.factories import ServiceSectorFactory


class ApplicationEventScheduleResultUpdateTestCase(ApplicationEventPermissionsTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.age_group = AgeGroupFactory()
        cls.application_too = ApplicationFactory(user=cls.regular_joe)
        cls.purpose = ReservationPurposeFactory()
        cls.ability_group = AbilityGroupFactory()
        cls.reservation_unit = ReservationUnitFactory()

        cls.other_user = get_user_model().objects.create(
            username="other",
            first_name="oth",
            last_name="er",
            email="oth.er@foo.com",
        )
        cls.application_event = cls.application.application_events.first()
        cls.schedule = cls.application_event.application_event_schedules.filter(priority=300).first()
        cls.result = ApplicationEventScheduleResultFactory(
            accepted=False,
            declined=False,
            allocated_day=1,
            allocated_begin=cls.schedule.begin,
            allocated_end=cls.schedule.end,
            application_event_schedule=cls.schedule,
            allocated_reservation_unit=cls.reservation_unit,
        )

    def get_create_query(self):
        return """
            mutation updateApplicationEventScheduleResult($input: ApplicationEventScheduleResultUpdateMutationInput!) {
                updateApplicationEventScheduleResult(input: $input){
                    applicationEventSchedule
                    errors {
                        messages field
                    }
                }
            }
        """

    def get_data(self):
        return {
            "accepted": True,
            "applicationEventSchedule": self.schedule.id,
            "allocatedReservationUnit": self.reservation_unit.id,
        }

    def test_update_result_updates_only_given_fields(self):
        data = self.get_data()
        data["declined"] = True

        self.client.force_login(self.general_admin)

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        app_event_data = content.get("data").get("updateApplicationEventScheduleResult")
        assert_that(content.get("errors")).is_none()
        assert_that(app_event_data.get("errors")).is_none()

        self.schedule.refresh_from_db()
        self.result.refresh_from_db()

        assert_that(self.result.application_event_schedule.id).is_equal_to(self.schedule.id)
        assert_that(self.result.allocated_begin).is_equal_to(self.schedule.begin)
        assert_that(self.result.allocated_end).is_equal_to(self.schedule.end)
        assert_that(self.result.allocated_reservation_unit.id).is_equal_to(self.reservation_unit.id)
        assert_that(self.result.allocated_day).is_equal_to(self.schedule.day)
        assert_that(self.result.allocated_duration).is_equal_to(datetime.timedelta(hours=1))
        assert_that(self.result.accepted).is_true()
        assert_that(self.result.declined).is_true()

    def test_application_user_cannot_update_result(self):
        self.client.force_login(self.regular_joe)

        response = self.query(self.get_create_query(), input_data=self.get_data())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        self.result.refresh_from_db()
        assert_that(self.result.accepted).is_false()

    def test_service_sector_admin_can_update_result(self):
        service_sector_admin = self.create_service_sector_admin()
        self.client.force_login(service_sector_admin)

        response = self.query(self.get_create_query(), input_data=self.get_data())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        app_event_data = content.get("data").get("updateApplicationEventScheduleResult")
        assert_that(content.get("errors")).is_none()
        assert_that(app_event_data.get("errors")).is_none()

        self.result.refresh_from_db()
        assert_that(self.result.accepted).is_true()

    def test_wrong_service_sector_admin_cannot_update_result(
        self,
    ):
        service_sector_admin = self.create_service_sector_admin(service_sector=ServiceSectorFactory())
        self.client.force_login(service_sector_admin)

        response = self.query(self.get_create_query(), input_data=self.get_data())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        self.result.refresh_from_db()
        assert_that(self.result.accepted).is_false()
