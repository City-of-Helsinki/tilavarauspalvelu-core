import datetime
import json

from assertpy import assert_that
from django.contrib.auth import get_user_model
from freezegun import freeze_time

from api.graphql.tests.test_applications.base import ApplicationTestCaseBase
from applications.models import Application, ApplicationEventStatus, ApplicationStatus
from applications.tests.factories import CityFactory, OrganisationFactory
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.tests.factories import (
    AbilityGroupFactory,
    AgeGroupFactory,
    ReservationPurposeFactory,
)


class ApplicationCreateTestCase(ApplicationTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.age_group = AgeGroupFactory()
        cls.purpose = ReservationPurposeFactory()
        cls.ability_group = AbilityGroupFactory()
        cls.reservation_unit = ReservationUnitFactory()
        cls.city = CityFactory(name="Hki")

        cls.other_user = get_user_model().objects.create(
            username="other",
            first_name="oth",
            last_name="er",
            email="oth.er@foo.com",
        )
        cls.organisation = OrganisationFactory()

    def get_create_query(self):
        return """
            mutation createApplication($input: ApplicationCreateMutationInput!) {
                createApplication(input: $input){
                    pk
                    errors {
                        messages field
                    }
                }
            }
        """

    def get_application_data(self, create_events=False):
        return {
            "applicantType": "company",
            "organisation": {
                "identifier": "123-identifier",
                "name": "Super organisation",
                "address": {
                    "streetAddress": "Testikatu 28",
                    "postCode": "33540",
                    "city": "Tampere",
                },
            },
            "contactPerson": {
                "firstName": "John",
                "lastName": "Wayne",
                "email": "john@test.com",
                "phoneNumber": "123-123",
            },
            "applicationRoundPk": self.application.application_round.id,
            "applicationEvents": [self.get_event_data()] if create_events else [],
            "status": ApplicationStatus.DRAFT,
            "billingAddress": {
                "streetAddress": "Laskukatu 1c",
                "postCode": "33540",
                "city": "Tampere",
            },
            "homeCityPk": self.city.id,
        }

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
            "eventsPerWeek": 2,
            "biweekly": False,
            "begin": datetime.date(2022, 8, 1).strftime("%Y-%m-%d"),
            "end": datetime.date(2023, 2, 28).strftime("%Y-%m-%d"),
            "purpose": self.purpose.id,
            "eventReservationUnits": [self.get_event_reservation_unit_data()],
            "status": ApplicationEventStatus.CREATED,
        }

    def test_create(self):
        assert_that(Application.objects.count()).is_equal_to(1)
        self.client.force_login(self.regular_joe)
        data = self.get_application_data()

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        app_data = content.get("data").get("createApplication")
        assert_that(content.get("errors")).is_none()
        assert_that(app_data.get("errors")).is_none()

        assert_that(Application.objects.count()).is_equal_to(2)

        application = Application.objects.get(id=app_data.get("pk"))
        assert_that(application).is_not_none()
        assert_that(application.status).is_equal_to(data["status"])

    def test_create_with_events(self):
        assert_that(Application.objects.count()).is_equal_to(1)
        self.client.force_login(self.regular_joe)
        data = self.get_application_data(create_events=True)

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        app_data = content.get("data").get("createApplication")
        assert_that(content.get("errors")).is_none()
        assert_that(app_data.get("errors")).is_none()

        assert_that(Application.objects.count()).is_equal_to(2)

        application = Application.objects.get(id=app_data.get("pk"))
        assert_that(application).is_not_none()
        assert_that(application.status).is_equal_to(data["status"])

        assert_that(application.application_events.count()).is_equal_to(1)
        assert_that(application.application_events.first().name).is_equal_to(
            "App event name"
        )

    def test_application_create_organization_identifier_not_required(self):
        assert_that(Application.objects.count()).is_equal_to(1)
        self.client.force_login(self.regular_joe)

        data = self.get_application_data()
        data["organisation"].pop("identifier")

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        app_data = content.get("data").get("createApplication")
        assert_that(app_data.get("errors")).is_none()

        assert_that(Application.objects.count()).is_equal_to(2)
        application = Application.objects.get(id=app_data.get("pk"))
        assert_that(application.organisation.identifier).is_none()

    def test_application_create_organization_identifier_cannot_be_empty(self):
        self.client.force_login(self.regular_joe)
        data = self.get_application_data()
        data["organisation"].update({"identifier": ""})
        assert_that(Application.objects.count()).is_equal_to(1)

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(Application.objects.count()).is_equal_to(1)

    def test_application_create_organization_address_cannot_be_empty(self):
        self.client.force_login(self.regular_joe)
        data = self.get_application_data()
        data["organisation"].update({"address": dict()})
        assert_that(Application.objects.count()).is_equal_to(1)

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)

        assert_that(Application.objects.count()).is_equal_to(1)

    def test_application_create_organization_address_not_included(self):
        self.client.force_login(self.regular_joe)
        data = self.get_application_data()
        data["organisation"].pop("address")
        assert_that(Application.objects.count()).is_equal_to(1)

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)

        assert_that(Application.objects.count()).is_equal_to(1)

    def test_application_create_organization_not_included(self):
        self.client.force_login(self.regular_joe)
        data = self.get_application_data()
        data["organisation"] = None
        assert_that(Application.objects.count()).is_equal_to(1)

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        app_data = content.get("data").get("createApplication")
        assert_that(app_data.get("errors")).is_none()
        assert_that(Application.objects.count()).is_equal_to(2)
        application = Application.objects.get(id=app_data.get("pk"))
        assert_that(application.organisation).is_none()

    def test_application_create_organization_email_can_be_empty(self):
        self.client.force_login(self.regular_joe)
        data = self.get_application_data()
        data["organisation"].update({"email": ""})

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        app_data = content.get("data").get("createApplication")
        assert_that(app_data.get("errors")).is_none()
        assert_that(Application.objects.count()).is_equal_to(2)
        application = Application.objects.get(id=app_data.get("pk"))
        assert_that(application.organisation.email).is_empty()

    def test_application_create_organization_email_cannot_be_null(self):
        self.client.force_login(self.regular_joe)
        data = self.get_application_data()
        data["organisation"].update({"email": None})

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(Application.objects.count()).is_equal_to(1)

    @freeze_time("2021-01-15")
    def test_application_in_review_invalid(self):
        self.client.force_login(self.regular_joe)
        assert_that(Application.objects.count()).is_equal_to(1)

        data = self.get_application_data()
        assert_that(data["applicationEvents"]).is_empty()
        data["status"] = ApplicationStatus.IN_REVIEW

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(Application.objects.count()).is_equal_to(1)

    def test_unauthenticated_cannot_create_application(self):
        response = self.query(
            self.get_create_query(), input_data=self.get_application_data()
        )
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to(
            "No permission to mutate"
        )
        assert_that(Application.objects.count()).is_equal_to(1)

    def test_user_can_create_application_event(self):
        response = self.query(
            self.get_create_query(), input_data=self.get_application_data()
        )
        assert_that(response.status_code).is_equal_to(200)
