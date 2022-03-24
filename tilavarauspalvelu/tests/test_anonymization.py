from assertpy import assert_that
from auditlog.models import LogEntry
from django.contrib.auth import get_user_model
from django.test import TestCase

from applications.tests.factories import (
    AddressFactory,
    ApplicationEventFactory,
    ApplicationFactory,
)
from reservations.tests.factories import ReservationFactory
from tilavarauspalvelu.utils.anonymisation import (
    anonymize_user,
    anonymize_user_applications,
    anonymize_user_reservations,
)


class AnonymizationTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.mr_anonymous = get_user_model().objects.create(
            username="anonym",
            first_name="anony",
            last_name="mous",
            email="anony.mous@foo.com",
        )
        cls.reservation = ReservationFactory.create(user=cls.mr_anonymous)
        billing_address = AddressFactory()
        cls.application = ApplicationFactory.create(
            user=cls.mr_anonymous, billing_address=billing_address
        )
        cls.app_event = ApplicationEventFactory.create(application=cls.application)

    def test_user_anonymization(self):
        user_data = self.mr_anonymous.__dict__.copy()
        anonymize_user(self.mr_anonymous)
        self.mr_anonymous.refresh_from_db()
        assert_that(self.mr_anonymous.username).is_equal_to(
            f"anonymized-{self.mr_anonymous.uuid}"
        )
        assert_that(self.mr_anonymous.first_name).is_not_equal_to(
            user_data["first_name"]
        )
        assert_that(self.mr_anonymous.last_name).is_not_equal_to(user_data["last_name"])
        assert_that(self.mr_anonymous.email).is_equal_to(
            f"{self.mr_anonymous.first_name}.{self.mr_anonymous.last_name}@anonymized.net"
        )
        assert_that(self.mr_anonymous.uuid).is_not_equal_to(user_data["uuid"])

    def test_application_anonymization(self):
        anonymize_user_applications(self.mr_anonymous)
        self.app_event.refresh_from_db()

        # Event
        assert_that(self.app_event.name).is_equal_to(
            "Sensitive data of this application has been anonymized by a script"
        )
        assert_that(self.app_event.name_fi).is_equal_to(
            "Sensitive data of this application has been anonymized by a script"
        )
        assert_that(self.app_event.name_en).is_equal_to(
            "Sensitive data of this application has been anonymized by a script"
        )
        assert_that(self.app_event.name_sv).is_equal_to(
            "Sensitive data of this application has been anonymized by a script"
        )

        # Actual application
        self.application.refresh_from_db()
        assert_that(self.application.additional_information).is_equal_to(
            "Sensitive data of this application has been anonymized by a script"
        )
        # Application billing address
        assert_that(self.application.billing_address.post_code).is_equal_to("99999")
        assert_that(self.application.billing_address.street_address).is_equal_to(
            "Anonymized"
        )
        assert_that(self.application.billing_address.street_address_fi).is_equal_to(
            "Anonymized"
        )
        assert_that(self.application.billing_address.street_address_en).is_equal_to(
            "Anonymized"
        )
        assert_that(self.application.billing_address.street_address_sv).is_equal_to(
            "Anonymized"
        )
        assert_that(self.application.billing_address.city).is_equal_to("Anonymized")
        assert_that(self.application.billing_address.city_fi).is_equal_to("Anonymized")
        assert_that(self.application.billing_address.city_en).is_equal_to("Anonymized")
        assert_that(self.application.billing_address.city_sv).is_equal_to("Anonymized")

        # Contact person
        assert_that(self.application.contact_person.first_name).is_equal_to(
            self.mr_anonymous.first_name
        )
        assert_that(self.application.contact_person.last_name).is_equal_to(
            self.mr_anonymous.last_name
        )
        assert_that(self.application.contact_person.email).is_equal_to(
            self.mr_anonymous.email
        )
        assert_that(self.application.contact_person.phone_number).is_equal_to("")

        # Organisation
        assert_that(self.application.organisation.name).is_equal_to("Anonymized")
        assert_that(self.application.organisation.identifier).is_equal_to("1234567-2")
        assert_that(self.application.organisation.email).is_equal_to(
            self.mr_anonymous.email
        )
        assert_that(self.application.organisation.core_business).is_equal_to(
            "Anonymized"
        )
        assert_that(self.application.organisation.core_business_fi).is_equal_to(
            "Anonymized"
        )
        assert_that(self.application.organisation.core_business_en).is_equal_to(
            "Anonymized"
        )
        assert_that(self.application.organisation.core_business_sv).is_equal_to(
            "Anonymized"
        )

        # Organisation address
        assert_that(self.application.organisation.address.post_code).is_equal_to(
            "99999"
        )
        assert_that(self.application.organisation.address.street_address).is_equal_to(
            "Anonymized"
        )
        assert_that(
            self.application.organisation.address.street_address_fi
        ).is_equal_to("Anonymized")
        assert_that(
            self.application.organisation.address.street_address_en
        ).is_equal_to("Anonymized")
        assert_that(
            self.application.organisation.address.street_address_sv
        ).is_equal_to("Anonymized")
        assert_that(self.application.organisation.address.city).is_equal_to(
            "Anonymized"
        )
        assert_that(self.application.organisation.address.city_fi).is_equal_to(
            "Anonymized"
        )
        assert_that(self.application.organisation.address.city_en).is_equal_to(
            "Anonymized"
        )
        assert_that(self.application.organisation.address.city_sv).is_equal_to(
            "Anonymized"
        )

    def test_reservation_anonymization(self):
        """Test also that the audit logger instances gets anonymized"""
        anonymize_user_reservations(self.mr_anonymous)
        self.reservation.refresh_from_db()

        assert_that(self.reservation.name).is_equal_to("Anonymized")
        assert_that(self.reservation.description).is_equal_to("Anonymized")
        assert_that(self.reservation.reservee_first_name).is_equal_to(
            self.mr_anonymous.first_name
        )
        assert_that(self.reservation.reservee_last_name).is_equal_to(
            self.mr_anonymous.last_name
        )
        assert_that(self.reservation.reservee_email).is_equal_to(
            self.mr_anonymous.email
        )
        assert_that(self.reservation.reservee_phone).is_equal_to("")
        assert_that(self.reservation.reservee_address_zip).is_equal_to("999999")
        assert_that(self.reservation.reservee_address_city).is_equal_to("Anonymized")
        assert_that(self.reservation.reservee_address_street).is_equal_to("Anonymized")
        assert_that(self.reservation.billing_first_name).is_equal_to(
            self.mr_anonymous.first_name
        )
        assert_that(self.reservation.billing_last_name).is_equal_to(
            self.mr_anonymous.last_name
        )
        assert_that(self.reservation.billing_email).is_equal_to(self.mr_anonymous.email)
        assert_that(self.reservation.billing_phone).is_equal_to("")
        assert_that(self.reservation.billing_address_zip).is_equal_to("99999")
        assert_that(self.reservation.billing_address_city).is_equal_to("Anonymized")
        assert_that(self.reservation.billing_address_street).is_equal_to("Anonymized")
        assert_that(self.reservation.reservee_id).is_equal_to("1234567-2")
        assert_that(self.reservation.reservee_organisation_name).is_equal_to(
            "Anonymized"
        )
        assert_that(self.reservation.working_memo).is_equal_to("")
        assert_that(self.reservation.free_of_charge_reason).is_equal_to(
            "Sensitive data of this reservation has been anonymized by a script"
        )
        assert_that(self.reservation.cancel_details).is_equal_to(
            "Sensitive data of this reservation has been anonymized by a script"
        )

        # Test that auditlog entries are wiped.
        assert_that(LogEntry.objects.get_for_object(self.reservation).count()).is_zero()
