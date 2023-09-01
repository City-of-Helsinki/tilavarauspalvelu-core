import datetime
import json

from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.utils import timezone
from freezegun import freeze_time

from api.graphql.tests.test_applications.base import ApplicationTestCaseBase
from applications.models import Application, ApplicationEventStatus, ApplicationStatus
from tests.factories import (
    AbilityGroupFactory,
    AddressFactory,
    AgeGroupFactory,
    ApplicationRoundFactory,
    CityFactory,
    OrganisationFactory,
    PersonFactory,
    ReservationPurposeFactory,
    ReservationUnitFactory,
    ServiceSectorFactory,
)


class ApplicationUpdateTestCase(ApplicationTestCaseBase):
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

    def get_valid_application_update_data(self):
        return {"pk": self.application.id, "additionalInformation": "This is updated"}

    def get_event_data(self, app_id=None):
        return {
            "name": "App event name",
            "applicationEventSchedules": [self.get_schedule_data()],
            "numPersons": 10,
            "ageGroup": self.age_group.id,
            "abilityGroup": self.ability_group.id,
            "minDuration": "01:00:00",
            "maxDuration": "02:00:00",
            "application": app_id,
            "eventsPerWeek": 2,
            "biweekly": False,
            "begin": datetime.date(2022, 8, 1).strftime("%Y-%m-%d"),
            "end": datetime.date(2023, 2, 28).strftime("%Y-%m-%d"),
            "purpose": self.purpose.id,
            "eventReservationUnits": [self.get_event_reservation_unit_data()],
            "status": ApplicationEventStatus.CREATED,
        }

    def get_schedule_data(self):
        return {"day": 1, "begin": "10:00", "end": "16:30"}

    def get_event_reservation_unit_data(self):
        return {"priority": 22, "reservationUnit": self.reservation_unit.id}

    def get_update_query(self):
        return """
            mutation updateApplication($input: ApplicationUpdateMutationInput!) {
                updateApplication(input: $input){
                    pk
                    errors {
                        messages field
                    }
                }
            }
        """

    def test_user_can_update_own_application(self):
        self.client.force_login(self.regular_joe)

        data = self.get_valid_application_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        app_data = content.get("data").get("updateApplication")
        assert_that(app_data.get("errors")).is_none()

        self.application.refresh_from_db()
        assert_that(self.application.additional_information).is_equal_to(data.get("additionalInformation"))

    def test_user_cannot_update_own_application_status_to_review_done(self):
        self.client.force_login(self.regular_joe)
        data = self.get_valid_application_update_data()
        data["status"] = ApplicationStatus.REVIEW_DONE

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).contains("No permission for status change")

        self.application.refresh_from_db()
        assert_that(self.application.status).is_equal_to(ApplicationStatus.IN_REVIEW)

    @freeze_time("2021-02-01")
    def test_user_cannot_update_own_application_after_period_end(self):
        self.client.force_login(self.regular_joe)

        application_round = ApplicationRoundFactory(
            name="Nuorten liikuntavuorot kevät 2021",
            application_period_begin=timezone.datetime(2021, 1, 1, 0, 0, 0).astimezone(),
            application_period_end=timezone.datetime(2021, 1, 31, 0, 0, 0).astimezone(),
        )
        self.application.application_round = application_round
        self.application.save()

        data = self.get_valid_application_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        assert_that(content.get("errors")[0].get("message")).is_equal_to("No permission to mutate")

        self.application.refresh_from_db()
        assert_that(self.application.additional_information).is_not_equal_to(data.get("additionalInformation"))

    def test_user_cannot_update_other_users_application(self):
        self.client.force_login(self.other_user)

        data = self.get_valid_application_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        assert_that(content.get("errors")[0].get("message")).is_equal_to("No permission to mutate")
        self.application.refresh_from_db()
        assert_that(self.application.additional_information).is_not_equal_to(data.get("additionalInformation"))

    def test_general_admin_can_update_users_application(self):
        self.client.force_login(self.general_admin)

        data = self.get_valid_application_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        app_data = content.get("data").get("updateApplication")
        assert_that(app_data.get("errors")).is_none()

        self.application.refresh_from_db()
        assert_that(self.application.additional_information).is_equal_to(data.get("additionalInformation"))

    def test_service_sector_admin_can_update_users_application(self):
        self.client.force_login(self.create_service_sector_admin())

        data = self.get_valid_application_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        app_data = content.get("data").get("updateApplication")
        assert_that(app_data.get("errors")).is_none()

        self.application.refresh_from_db()
        assert_that(self.application.additional_information).is_equal_to(data.get("additionalInformation"))

    def test_service_sector_application_manager_can_update_users_application(self):
        self.client.force_login(self.create_service_sector_application_manager())

        data = self.get_valid_application_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        app_data = content.get("data").get("updateApplication")
        assert_that(app_data.get("errors")).is_none()

        self.application.refresh_from_db()
        assert_that(self.application.additional_information).is_equal_to(data.get("additionalInformation"))

    def test_wrong_service_sector_admin_cannot_create_or_update_application(self):
        sadmin = self.create_service_sector_admin()
        role = sadmin.service_sector_roles.first()
        role.service_sector = ServiceSectorFactory()
        role.save()

        self.client.force_login(sadmin)

        data = self.get_valid_application_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        assert_that(content.get("errors")[0].get("message")).is_equal_to("No permission to mutate")
        self.application.refresh_from_db()
        assert_that(self.application.additional_information).is_not_equal_to(data.get("additionalInformation"))

    def test_application_status_set_sent_from_in_review_fails(self):
        self.client.force_login(self.general_admin)

        data = self.get_valid_application_update_data()

        self.application.set_status(ApplicationStatus.IN_REVIEW)
        data["status"] = ApplicationStatus.SENT

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).contains(
            "Applications in DRAFT or IN_REVIEW status cannot set as SENT."
        )

        self.application.refresh_from_db()
        assert_that(self.application.status).is_equal_to(ApplicationStatus.IN_REVIEW)

    def test_application_status_set_sent_from_draft_fails(self):
        self.client.force_login(self.general_admin)

        data = self.get_valid_application_update_data()

        self.application.set_status(ApplicationStatus.DRAFT)
        data["status"] = ApplicationStatus.SENT

        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).contains(
            "Applications in DRAFT or IN_REVIEW status cannot set as SENT."
        )

        self.application.refresh_from_db()
        assert_that(self.application.status).is_equal_to(ApplicationStatus.DRAFT)

    def test_application_status_set_draft_from_in_review_success(self):
        self.client.force_login(self.general_admin)

        data = self.get_valid_application_update_data()

        self.application.set_status(ApplicationStatus.IN_REVIEW)
        data["status"] = ApplicationStatus.DRAFT
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        app_data = content.get("data").get("updateApplication")
        assert_that(app_data.get("errors")).is_none()

        self.application.refresh_from_db()
        assert_that(self.application.status).is_equal_to(ApplicationStatus.DRAFT)

    def test_application_status_set_sent_assigns_when_not_in_review_nor_draft(self):
        self.client.force_login(self.general_admin)

        data = self.get_valid_application_update_data()

        self.application.set_status(ApplicationStatus.REVIEW_DONE)
        data["status"] = ApplicationStatus.SENT
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        app_data = content.get("data").get("updateApplication")
        assert_that(app_data.get("errors")).is_none()

        self.application.refresh_from_db()
        assert_that(self.application.status).is_equal_to(ApplicationStatus.SENT)

    def test_application_update_should_create_new_contact_person_and_billing_address(
        self,
    ):
        self.client.force_login(self.regular_joe)
        contact_person_id = self.application.contact_person_id
        billing_address_id = self.application.billing_address_id

        data = self.get_valid_application_update_data()
        data.update(
            {
                "contactPerson": {
                    "firstName": "John",
                    "lastName": "Malkovich",
                    "email": "test@test.com",
                    "phoneNumber": "123",
                },
                "billingAddress": {
                    "streetAddress": "Bill me",
                    "postCode": "00100",
                    "city": "Helsinki",
                },
            }
        )

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        app_data = content.get("data").get("updateApplication")
        assert_that(app_data.get("errors")).is_none()

        self.application.refresh_from_db()
        assert_that(self.application.contact_person_id).is_not_equal_to(contact_person_id)
        assert_that(self.application.contact_person.last_name).is_equal_to("Malkovich")
        assert_that(self.application.billing_address_id).is_not_equal_to(billing_address_id)
        assert_that(self.application.billing_address.street_address).is_equal_to("Bill me")

    def test_application_update_should_update_contact_person_and_billing_address(self):
        self.client.force_login(self.regular_joe)

        person = PersonFactory()
        address = AddressFactory()

        data = self.get_valid_application_update_data()
        data.update(
            {
                "pk": self.application.id,
                "contactPerson": {
                    "pk": person.id,
                    "firstName": person.first_name,
                    "lastName": "Modified",
                    "email": person.email,
                    "phoneNumber": person.phone_number,
                },
                "billingAddress": {
                    "pk": address.id,
                    "streetAddress": "No bills please",
                    "postCode": "99999",
                    "city": "None",
                },
            }
        )

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        app_data = content.get("data").get("updateApplication")
        assert_that(app_data.get("errors")).is_none()

        self.application.refresh_from_db()
        assert_that(self.application.contact_person.id).is_equal_to(person.id)
        assert_that(self.application.contact_person.last_name).is_equal_to("Modified")
        assert_that(self.application.billing_address.id).is_equal_to(address.id)
        assert_that(self.application.billing_address.street_address).is_equal_to("No bills please")

    def test_application_update_review_valid(self):
        self.client.force_login(self.regular_joe)
        person = PersonFactory()

        round_begin = datetime.datetime.now() - datetime.timedelta(days=7)
        round_end = datetime.datetime.now() + datetime.timedelta(days=7)
        application_round = ApplicationRoundFactory(
            application_period_begin=round_begin, application_period_end=round_end
        )
        self.application.application_round = application_round
        self.application.save()

        data = {
            "pk": self.application.id,
            "applicantType": Application.APPLICANT_TYPE_COMPANY,
            "organisation": {
                "pk": self.organisation.id,
                "identifier": self.organisation.identifier,
                "name": "Super organisation modified",
                "address": {
                    "streetAddress": "Osoitetie 11b",
                    "postCode": "33540",
                    "city": "Tampere",
                },
            },
            "contactPerson": {
                "pk": person.id,
                "firstName": person.first_name,
                "lastName": "The modified",
                "email": person.email,
                "phoneNumber": person.phone_number,
            },
            "applicationRoundPk": application_round.id,
            "applicationEvents": [self.get_event_data(app_id=self.application.id)],
            "status": "in_review",
            "billingAddress": None,
        }

        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(response.status_code).is_equal_to(200)

    def test_application_events_does_not_get_deleted_if_not_in_data(self):
        self.client.force_login(self.regular_joe)

        app_event_count = self.application.application_events.count()

        data = self.get_valid_application_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        app_data = content.get("data").get("updateApplication")
        assert_that(app_data.get("errors")).is_none()

        self.application.refresh_from_db()
        assert_that(self.application.application_events.count()).is_equal_to(app_event_count)

    def test_application_events_does_get_deleted_if_in_data_and_empty(self):
        self.client.force_login(self.regular_joe)

        assert_that(self.application.application_events.count()).is_equal_to(1)

        data = self.get_valid_application_update_data()
        data["applicationEvents"] = []
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        app_data = content.get("data").get("updateApplication")
        assert_that(app_data.get("errors")).is_none()

        self.application.refresh_from_db()
        assert_that(self.application.application_events.count()).is_zero()

    def test_application_update_should_update_organisation_and_contact_person(self):
        self.client.force_login(self.regular_joe)
        assert_that(Application.objects.count()).is_equal_to(1)

        round_begin = datetime.datetime.now() - datetime.timedelta(days=7)
        round_end = datetime.datetime.now() + datetime.timedelta(days=7)
        application_round = ApplicationRoundFactory(
            application_period_begin=round_begin, application_period_end=round_end
        )
        self.application.application_round = application_round
        self.application.save()

        person = PersonFactory()
        data = {
            "pk": self.application.id,
            "applicantType": "company",
            "organisation": {
                "pk": self.organisation.id,
                "identifier": self.organisation.identifier,
                "name": "Super organisation modified",
                "address": {
                    "streetAddress": "Testikatu 1",
                    "postCode": "33540",
                    "city": "Tampere",
                },
            },
            "contactPerson": {
                "pk": person.id,
                "firstName": person.first_name,
                "lastName": "The modified",
                "email": person.email,
                "phoneNumber": person.phone_number,
            },
            "applicationRoundPk": self.application.application_round.id,
            "applicationEvents": [],
            "status": "draft",
            "billingAddress": None,
        }

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        app_data = content.get("data").get("updateApplication")
        assert_that(app_data.get("errors")).is_none()
        assert_that(Application.objects.count()).is_equal_to(1)
        application = Application.objects.get(id=app_data.get("pk"))

        assert_that(application.contact_person.id).is_equal_to(person.id)
        assert_that(application.contact_person.last_name).is_equal_to("The modified")

        assert_that(application.organisation.id).is_equal_to(self.organisation.id)
        assert_that(application.organisation.name).is_equal_to("Super organisation modified")

    def test_application_update_should_null_organisation_and_contact_person_for_draft(
        self,
    ):
        self.client.force_login(self.regular_joe)
        assert_that(Application.objects.count()).is_equal_to(1)

        round_begin = datetime.datetime.now() - datetime.timedelta(days=7)
        round_end = datetime.datetime.now() + datetime.timedelta(days=7)
        application_round = ApplicationRoundFactory(
            application_period_begin=round_begin, application_period_end=round_end
        )
        self.application.application_round = application_round
        self.application.save()

        data = {
            "pk": self.application.id,
            "applicantType": Application.APPLICANT_TYPE_INDIVIDUAL,
            "organisation": None,
            "contactPerson": None,
            "applicationRoundPk": application_round.id,
            "applicationEvents": [],
            "status": "draft",
            "billingAddress": None,
        }

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        app_data = content.get("data").get("updateApplication")
        assert_that(app_data.get("errors")).is_none()
        assert_that(Application.objects.count()).is_equal_to(1)
        application = Application.objects.get(id=app_data.get("pk"))

        assert_that(application.contact_person).is_none()
        assert_that(application.organisation).is_none()

    def test_application_update_should_force_contact_person_for_in_review(self):
        self.client.force_login(self.regular_joe)
        assert_that(Application.objects.count()).is_equal_to(1)

        round_begin = datetime.datetime.now() - datetime.timedelta(days=7)
        round_end = datetime.datetime.now() + datetime.timedelta(days=7)
        application_round = ApplicationRoundFactory(
            application_period_begin=round_begin, application_period_end=round_end
        )

        data = {
            "pk": self.application.id,
            "applicantType": Application.APPLICANT_TYPE_INDIVIDUAL,
            "organisation": None,
            "contactPerson": None,
            "applicationRoundPk": application_round.id,
            "applicationEvents": [self.get_event_data(app_id=self.application.id)],
            "status": ApplicationStatus.IN_REVIEW,
            "billingAddress": None,
        }

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_application_update_updating_and_adding_application_events(self):
        self.client.force_login(self.regular_joe)
        assert_that(Application.objects.count()).is_equal_to(1)

        round_begin = datetime.datetime.now() - datetime.timedelta(days=7)
        round_end = datetime.datetime.now() + datetime.timedelta(days=7)
        application_round = ApplicationRoundFactory(
            application_period_begin=round_begin, application_period_end=round_end
        )

        application_event = self.application.application_events.first()
        application_event.num_persons = 20
        application_event.save()

        existing_event = dict(self.get_event_data(app_id=self.application.id))
        existing_event["pk"] = application_event.id
        existing_event["name"] = "Updated name"
        existing_event["numPersons"] = 112
        existing_event["applicationEventSchedules"] = [{"day": 3, "begin": "10:40", "end": "16:30"}]

        valid_application_event_data = self.get_event_data(app_id=self.application.id)

        valid_application_event_data["name"] = "New event name"
        data = {
            "pk": self.application.id,
            "applicantType": Application.APPLICANT_TYPE_INDIVIDUAL,
            "organisation": None,
            "contactPerson": {
                "firstName": "Hak",
                "lastName": "Ija",
                "email": "hak.ija@test.com",
                "phoneNumber": "123-123",
            },
            "applicationRoundPk": application_round.id,
            "applicationEvents": [existing_event, valid_application_event_data],
            "status": "draft",
            "billingAddress": None,
        }

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        app_data = content.get("data").get("updateApplication")
        assert_that(app_data.get("errors")).is_none()

        self.application.refresh_from_db()
        assert_that(
            self.application.application_events.filter(name__in=["Updated name", "New event name"]).count()
        ).is_equal_to(2)
        assert_that(self.application.application_events.count()).is_equal_to(2)

        event = self.application.application_events.filter(id=existing_event.get("pk")).first()
        assert_that(event).is_not_none()
        assert_that(event.num_persons).is_equal_to(112)
        assert_that(event.name).is_equal_to("Updated name")
        assert_that(event.application_event_schedules.first().day).is_equal_to(3)

        otha_event = self.application.application_events.exclude(id=existing_event.get("pk")).first()
        assert_that(otha_event.name).is_equal_to("New event name")

    def test_application_update_should_remove_application_events_if_no_longer_in_data(
        self,
    ):
        self.client.force_login(self.regular_joe)
        assert_that(Application.objects.count()).is_equal_to(1)

        round_begin = datetime.datetime.now() - datetime.timedelta(days=7)
        round_end = datetime.datetime.now() + datetime.timedelta(days=7)
        application_round = ApplicationRoundFactory(
            application_period_begin=round_begin, application_period_end=round_end
        )

        valid_application_event_data = self.get_event_data(app_id=self.application.id)
        valid_application_event_data["name"] = "New event name"
        data = {
            "pk": self.application.id,
            "applicantType": Application.APPLICANT_TYPE_INDIVIDUAL,
            "organisation": None,
            "contactPerson": {
                "firstName": "John",
                "lastName": "Wayne",
                "email": "john@test.com",
                "phoneNumber": "123-123",
            },
            "applicationRoundPk": application_round.id,
            "applicationEvents": [valid_application_event_data],
            "status": "draft",
            "billingAddress": None,
        }

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        app_data = content.get("data").get("updateApplication")
        assert_that(app_data.get("errors")).is_none()

        assert_that(self.application.application_events.count()).is_equal_to(1)
        event = self.application.application_events.first()
        assert_that(event.name).is_equal_to("New event name")

        app_data = content.get("data").get("updateApplication")
        assert_that(app_data.get("errors")).is_none()
