import datetime
import json

from assertpy import assert_that
from dateutil.relativedelta import relativedelta
from django.contrib.auth import get_user_model

from api.graphql.tests.test_application_events.base import (
    ApplicationEventPermissionsTestCaseBase,
)
from applications.models import ApplicationEvent, ApplicationEventStatus
from applications.tests.factories import (
    ApplicationEventFactory,
    ApplicationEventScheduleFactory,
    ApplicationFactory,
)
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import (
    AbilityGroupFactory,
    AgeGroupFactory,
    ReservationPurposeFactory,
)
from spaces.tests.factories import ServiceSectorFactory


class ApplicationEventUpdateTestCase(ApplicationEventPermissionsTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.age_group = AgeGroupFactory(minimum=15, maximum=22)
        cls.application_too = ApplicationFactory(user=cls.regular_joe)
        cls.purpose = ReservationPurposeFactory()
        cls.ability_group = AbilityGroupFactory()
        cls.reservation_unit = ReservationUnitFactory()

        the_date = datetime.date(2022, 8, 1)
        cls.application_event = ApplicationEventFactory(
            application=cls.application_too,
            name="Update this application",
            events_per_week=2,
            num_persons=10,
            begin=the_date,
            end=the_date + relativedelta(months=6),
            age_group=AgeGroupFactory(minimum=10, maximum=15),
            ability_group=cls.ability_group,
            purpose=cls.purpose,
        )
        cls.schedule = ApplicationEventScheduleFactory(
            day=2,
            begin=datetime.time(12, 00),
            end=datetime.time(13, 00),
            priority=300,
            application_event=cls.application_event,
        )

        cls.other_user = get_user_model().objects.create(
            username="other",
            first_name="oth",
            last_name="er",
            email="oth.er@foo.com",
        )

    def get_update_query(self):
        return """
        mutation updateApplicationEvent($input: ApplicationEventUpdateMutationInput!) {
            updateApplicationEvent(input: $input){
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
            "pk": self.application_event.id,
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

    def test_update(self):
        assert_that(ApplicationEvent.objects.count()).is_equal_to(2)
        self.client.force_login(self.general_admin)
        data = self.get_event_data()

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        app_event_data = content.get("data").get("updateApplicationEvent")
        assert_that(content.get("errors")).is_none()
        assert_that(app_event_data.get("errors")).is_none()

        assert_that(ApplicationEvent.objects.count()).is_equal_to(2)

        app_event = ApplicationEvent.objects.get(id=app_event_data.get("pk"))
        assert_that(app_event).is_not_none()
        assert_that(app_event.application_event_schedules.count()).is_equal_to(1)
        schedule = app_event.application_event_schedules.first()
        assert_that(schedule.id).is_not_equal_to(self.schedule.id)
        assert_that(schedule.day).is_equal_to(self.get_schedule_data()["day"])
        assert_that(schedule.begin).is_equal_to(
            datetime.time().fromisoformat(self.get_schedule_data()["begin"])
        )
        assert_that(schedule.end).is_equal_to(
            datetime.time().fromisoformat(self.get_schedule_data()["end"])
        )
        assert_that(app_event.event_reservation_units.count()).is_equal_to(1)
        assert_that(
            app_event.event_reservation_units.first().reservation_unit.id
        ).is_equal_to(self.reservation_unit.id)
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
        assert_that(ApplicationEvent.objects.count()).is_equal_to(2)

    def test_application_event_invalid_durations(self):
        self.client.force_login(self.general_admin)
        data = self.get_event_data()
        data["maxDuration"] = "00:45:00"

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        app_event_data = content.get("data").get("updateApplicationEvent")
        assert_that(content.get("errors")).is_none()
        assert_that(app_event_data.get("errors")).is_not_none()
        assert_that(app_event_data.get("errors")[0].get("messages")).contains(
            "Maximum duration should be larger than minimum duration"
        )

    def test_application_user_can_update_application_event_in_own_application(self):
        self.client.force_login(self.regular_joe)

        data = self.get_event_data()
        data["name"] = "update"

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        app_event_data = content.get("data").get("updateApplicationEvent")
        assert_that(content.get("errors")).is_none()
        assert_that(app_event_data.get("errors")).is_none()
        self.application_event.refresh_from_db()
        assert_that(self.application_event.name).is_equal_to(data["name"])

    def test_user_cannot_update_event_to_other_application(self):
        self.client.force_login(self.other_user)
        data = self.get_event_data()

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_general_admin_can_update_to_users_application(self):
        self.client.force_login(self.general_admin)
        data = self.get_event_data()
        data["name"] = "updated_name"

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        app_event_data = content.get("data").get("updateApplicationEvent")
        assert_that(app_event_data.get("errors")).is_none()
        self.application_event.refresh_from_db()
        assert_that(self.application_event.name).is_equal_to(data["name"])

    def test_service_sector_admin_can_update_to_users_application(self):
        service_sector_admin = self.create_service_sector_admin(
            service_sector=self.application_too.application_round.service_sector
        )
        self.client.force_login(service_sector_admin)
        data = self.get_event_data()
        data["name"] = "updated_name"

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        app_event_data = content.get("data").get("updateApplicationEvent")
        assert_that(app_event_data.get("errors")).is_none()
        self.application_event.refresh_from_db()
        assert_that(self.application_event.name).is_equal_to(data["name"])

    def test_wrong_service_sector_admin_cannot_create_to_application(
        self,
    ):
        service_sector_admin = self.create_service_sector_admin(
            service_sector=ServiceSectorFactory()
        )
        self.client.force_login(service_sector_admin)
        data = self.get_event_data()

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
