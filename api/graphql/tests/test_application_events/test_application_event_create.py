import datetime
import json

from assertpy import assert_that
from django.contrib.auth import get_user_model

from api.graphql.tests.test_application_events.base import (
    ApplicationEventPermissionsTestCaseBase,
)
from applications.models import ApplicationEvent, ApplicationEventStatus
from applications.tests.factories import ApplicationFactory
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import (
    AbilityGroupFactory,
    AgeGroupFactory,
    ReservationPurposeFactory,
)
from spaces.tests.factories import ServiceSectorFactory


class ApplicationEventCreateTestCase(ApplicationEventPermissionsTestCaseBase):
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

    def get_create_query(self):
        return """
            mutation createApplicationEvent($input: ApplicationEventCreateMutationInput!) {
                createApplicationEvent(input: $input){
                    pk
                    errors {
                        messages field
                    }
                }
            }
        """

    def get_schedule_data(self):
        return {"day": 1, "begin": "10:00", "end": "16:30"}

    def get_event_reservation_unit_data(self):
        return {"priority": 22, "reservationUnit": self.reservation_unit.id}

    def get_event_data(self):
        return {
            "name": "App event name",
            "applicationEventSchedules": [self.get_schedule_data()],
            "numPersons": 10,
            "ageGroup": self.age_group.id,
            "abilityGroup": self.ability_group.id,
            "minDuration": "01:00:00",
            "maxDuration": "02:00:00",
            "application": self.application_too.id,
            "eventsPerWeek": 2,
            "biweekly": False,
            "begin": datetime.date(2022, 8, 1).strftime("%Y-%m-%d"),
            "end": datetime.date(2023, 2, 28).strftime("%Y-%m-%d"),
            "purpose": self.purpose.id,
            "eventReservationUnits": [self.get_event_reservation_unit_data()],
            "status": ApplicationEventStatus.CREATED,
        }

    def test_create(self):
        assert_that(ApplicationEvent.objects.count()).is_equal_to(1)
        self.client.force_login(self.general_admin)
        data = self.get_event_data()

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        app_event_data = content.get("data").get("createApplicationEvent")
        assert_that(content.get("errors")).is_none()
        assert_that(app_event_data.get("errors")).is_none()

        assert_that(ApplicationEvent.objects.count()).is_equal_to(2)

        app_event = ApplicationEvent.objects.get(id=app_event_data.get("pk"))
        assert_that(app_event).is_not_none()
        assert_that(app_event.application_event_schedules.count()).is_equal_to(1)
        assert_that(app_event.event_reservation_units.count()).is_equal_to(1)
        assert_that(app_event.name).is_equal_to(data["name"])
        assert_that(app_event.num_persons).is_equal_to(data["numPersons"])
        assert_that(app_event.age_group_id).is_equal_to(self.age_group.id)
        assert_that(app_event.ability_group_id).is_equal_to(self.ability_group.id)
        assert_that(app_event.application_id).is_equal_to(self.application_too.id)
        assert_that(app_event.purpose_id).is_equal_to(self.purpose.id)
        assert_that(app_event.min_duration).is_equal_to(datetime.timedelta(hours=1))
        assert_that(app_event.max_duration).is_equal_to(datetime.timedelta(hours=2))
        assert_that(app_event.events_per_week).is_equal_to(data["eventsPerWeek"])
        assert_that(app_event.biweekly).is_equal_to(data["biweekly"])
        assert_that(app_event.end).is_equal_to(datetime.date.fromisoformat(data["end"]))
        assert_that(app_event.begin).is_equal_to(
            datetime.date.fromisoformat(data["begin"])
        )
        assert_that(app_event.status).is_equal_to(data["status"])

    def test_application_event_invalid_durations(self):
        self.client.force_login(self.general_admin)
        data = self.get_event_data()
        data["maxDuration"] = "00:45:00"

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        app_event_data = content.get("data").get("createApplicationEvent")
        assert_that(content.get("errors")).is_none()
        assert_that(app_event_data.get("errors")).is_not_none()
        assert_that(app_event_data.get("errors")[0].get("messages")).contains(
            "Maximum duration should be larger than minimum duration"
        )

    def test_application_user_can_create_application_event_to_own_application(self):
        self.client.force_login(self.regular_joe)

        data = self.get_event_data()
        data["name"] = "user_creation"

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        app_event_data = content.get("data").get("createApplicationEvent")
        assert_that(content.get("errors")).is_none()
        assert_that(app_event_data.get("errors")).is_none()
        event = ApplicationEvent.objects.get(id=app_event_data["pk"])
        assert_that(event.name).is_equal_to(data["name"])

    def test_user_cannot_create_event_to_other_application(self):
        self.client.force_login(self.other_user)
        data = self.get_event_data()
        data["application"] = self.application.id

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_general_admin_can_create_to_users_application(self):
        self.client.force_login(self.general_admin)
        data = self.get_event_data()
        data["application"] = self.application.id
        data["name"] = "updated_name"

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        app_event_data = content.get("data").get("createApplicationEvent")
        assert_that(app_event_data.get("errors")).is_none()
        event = ApplicationEvent.objects.get(id=app_event_data["pk"])
        assert_that(event.name).is_equal_to(data["name"])

    def test_service_sector_admin_can_create_to_users_application(self):
        service_sector_admin = self.create_service_sector_admin()
        self.client.force_login(service_sector_admin)
        data = self.get_event_data()
        data["application"] = self.application.id
        data["name"] = "updated_name"

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        app_event_data = content.get("data").get("createApplicationEvent")
        assert_that(app_event_data.get("errors")).is_none()
        event = ApplicationEvent.objects.get(id=app_event_data["pk"])
        assert_that(event.name).is_equal_to(data["name"])

    def test_wrong_service_sector_admin_cannot_create_to_application(
        self,
    ):
        service_sector_admin = self.create_service_sector_admin(
            service_sector=ServiceSectorFactory()
        )
        self.client.force_login(service_sector_admin)
        data = self.get_event_data()
        data["application"] = self.application.id

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
