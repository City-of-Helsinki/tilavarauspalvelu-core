import datetime
import json

from assertpy import assert_that
from django.contrib.auth import get_user_model

from api.graphql.tests.test_application_events.base import (
    ApplicationEventPermissionsTestCaseBase,
)
from applications.models import ApplicationEventScheduleResult
from applications.tests.factories import ApplicationFactory
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import (
    AbilityGroupFactory,
    AgeGroupFactory,
    ReservationPurposeFactory,
)
from spaces.tests.factories import ServiceSectorFactory


class ApplicationEventScheduleResultCreateTestCase(
    ApplicationEventPermissionsTestCaseBase
):
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
        cls.schedule = cls.application_event.application_event_schedules.filter(
            priority=300
        ).first()

    def get_create_query(self):
        return """
            mutation createApplicationEventScheduleResult($input: ApplicationEventScheduleResultCreateMutationInput!) {
                createApplicationEventScheduleResult(input: $input){
                    applicationEventSchedule
                    errors {
                        messages field
                    }
                }
            }
        """

    def get_data(self):
        return {
            "applicationEventSchedule": self.schedule.id,
            "allocatedReservationUnit": self.reservation_unit.id,
        }

    def test_create_result(self):
        data = {
            "accepted": True,
            "declined": True,
            "allocatedDay": 1,
            "allocatedBegin": "10:00",
            "allocatedEnd": "12:00",
            "applicationEventSchedule": self.schedule.id,
            "allocatedReservationUnit": self.reservation_unit.id,
        }
        assert_that(
            getattr(self.schedule, "application_event_schedule_result", None)
        ).is_none()
        self.client.force_login(self.general_admin)

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        app_event_data = content.get("data").get("createApplicationEventScheduleResult")
        assert_that(content.get("errors")).is_none()
        assert_that(app_event_data.get("errors")).is_none()

        self.schedule.refresh_from_db()
        assert_that(
            getattr(self.schedule, "application_event_schedule_result", None)
        ).is_not_none()

        result = ApplicationEventScheduleResult.objects.get(pk=self.schedule.id)

        assert_that(result.application_event_schedule.id).is_equal_to(self.schedule.id)
        assert_that(result.allocated_begin).is_equal_to(
            datetime.time.fromisoformat(data["allocatedBegin"])
        )
        assert_that(result.allocated_end).is_equal_to(
            datetime.time.fromisoformat(data["allocatedEnd"])
        )
        assert_that(result.allocated_reservation_unit.id).is_equal_to(
            data["allocatedReservationUnit"]
        )
        assert_that(result.allocated_day).is_equal_to(data["allocatedDay"])
        assert_that(result.allocated_duration).is_equal_to(datetime.timedelta(hours=2))
        assert_that(result.accepted).is_equal_to(data["accepted"])
        assert_that(result.declined).is_equal_to(data["declined"])

    def test_create_result_with_empty_data_uses_schedule_data(self):
        assert_that(
            getattr(self.schedule, "application_event_schedule_result", None)
        ).is_none()
        self.client.force_login(self.general_admin)

        response = self.query(self.get_create_query(), input_data=self.get_data())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        app_event_data = content.get("data").get("createApplicationEventScheduleResult")
        assert_that(content.get("errors")).is_none()
        assert_that(app_event_data.get("errors")).is_none()

        self.schedule.refresh_from_db()

        result = ApplicationEventScheduleResult.objects.get(pk=self.schedule.id)

        assert_that(result.application_event_schedule.id).is_equal_to(self.schedule.id)
        assert_that(result.allocated_begin).is_equal_to(self.schedule.begin)
        assert_that(result.allocated_end).is_equal_to(self.schedule.end)
        assert_that(result.allocated_reservation_unit.id).is_equal_to(
            self.reservation_unit.id
        )
        assert_that(result.allocated_day).is_equal_to(self.schedule.day)
        assert_that(result.allocated_duration).is_equal_to(datetime.timedelta(hours=1))
        assert_that(result.accepted).is_false()
        assert_that(result.declined).is_false()

    def test_application_user_cannot_create_result(self):
        assert_that(
            getattr(self.schedule, "application_event_schedule_result", None)
        ).is_none()
        self.client.force_login(self.regular_joe)

        response = self.query(self.get_create_query(), input_data=self.get_data())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(
            ApplicationEventScheduleResult.objects.filter(pk=self.schedule.id).exists()
        ).is_false()

    def test_service_sector_admin_can_create_result(self):
        service_sector_admin = self.create_service_sector_admin()
        self.client.force_login(service_sector_admin)

        response = self.query(self.get_create_query(), input_data=self.get_data())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        app_event_data = content.get("data").get("createApplicationEventScheduleResult")
        assert_that(content.get("errors")).is_none()
        assert_that(app_event_data.get("errors")).is_none()

        self.schedule.refresh_from_db()

        result = ApplicationEventScheduleResult.objects.get(pk=self.schedule.id)

        assert_that(result.application_event_schedule.id).is_equal_to(self.schedule.id)

    def test_wrong_service_sector_admin_cannot_create_result(
        self,
    ):
        service_sector_admin = self.create_service_sector_admin(
            service_sector=ServiceSectorFactory()
        )
        self.client.force_login(service_sector_admin)

        response = self.query(self.get_create_query(), input_data=self.get_data())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(
            ApplicationEventScheduleResult.objects.filter(pk=self.schedule.id).exists()
        ).is_false()
