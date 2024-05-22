from auditlog.models import LogEntry
from django.test import TestCase

from permissions.models import (
    GeneralRole,
    GeneralRoleChoice,
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    UnitRole,
    UnitRoleChoice,
)
from tests.factories import (
    AddressFactory,
    ApplicationFactory,
    ApplicationSectionFactory,
    ReservationFactory,
    ServiceSectorFactory,
    UnitFactory,
    UserFactory,
)
from users.anonymisation import (
    ANONYMIZED,
    SENSITIVE_APPLICATION,
    SENSITIVE_RESERVATION,
    anonymize_user,
    anonymize_user_applications,
    anonymize_user_reservations,
)
from users.models import ReservationNotification


class AnonymizationTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.mr_anonymous = UserFactory.create_superuser(
            username="anonym",
            first_name="anony",
            last_name="mous",
            email="anony.mous@foo.com",
            reservation_notification=ReservationNotification.ALL,
        )

        general_role_choice = GeneralRoleChoice.objects.create(code="general_role")
        GeneralRole.objects.create(role=general_role_choice, user=cls.mr_anonymous)

        service_sector = ServiceSectorFactory(name="Role testing sector")
        service_sector_role_choice = ServiceSectorRoleChoice.objects.create(code="service_sector_role")
        ServiceSectorRole.objects.create(
            role=service_sector_role_choice,
            service_sector=service_sector,
            user=cls.mr_anonymous,
        )

        unit = UnitFactory(name="Role testing unit")
        unit_role_choice = UnitRoleChoice.objects.create(code="unit_role")
        unit_role = UnitRole.objects.create(role=unit_role_choice, user=cls.mr_anonymous)
        unit_role.unit.add(unit)

        cls.reservation = ReservationFactory.create(
            user=cls.mr_anonymous,
            reservee_address_zip="0100",
            reservee_address_city="Helsinki",
            reservee_address_street="Test Address 1",
            billing_address_zip="01000",
            billing_address_city="Helsinki",
            billing_address_street="Test Address 1",
            free_of_charge_reason="Test reason",
            cancel_details="Test cancel details",
            handling_details="Test handling details",
        )
        billing_address = AddressFactory()
        cls.application = ApplicationFactory.create(user=cls.mr_anonymous, billing_address=billing_address)
        cls.app_section = ApplicationSectionFactory.create(application=cls.application)

    def test_user_anonymization(self):
        user_data = self.mr_anonymous.__dict__.copy()
        anonymize_user(self.mr_anonymous)
        self.mr_anonymous.refresh_from_db()
        assert self.mr_anonymous.username == f"anonymized-{self.mr_anonymous.uuid}"
        assert self.mr_anonymous.first_name == "ANON"
        assert self.mr_anonymous.last_name == "ANONYMIZED"
        assert self.mr_anonymous.email == f"{self.mr_anonymous.first_name}.{self.mr_anonymous.last_name}@anonymized.net"
        assert self.mr_anonymous.uuid != user_data["uuid"]
        assert self.mr_anonymous.reservation_notification == ReservationNotification.NONE
        assert self.mr_anonymous.is_active is False
        assert self.mr_anonymous.is_superuser is False
        assert self.mr_anonymous.is_staff is False

        assert GeneralRole.objects.filter(user=self.mr_anonymous).count() == 0
        assert ServiceSectorRole.objects.filter(user=self.mr_anonymous).count() == 0
        assert UnitRole.objects.filter(user=self.mr_anonymous).count() == 0

    def test_application_anonymization(self):
        anonymize_user_applications(self.mr_anonymous)
        self.app_section.refresh_from_db()

        # Section
        assert self.app_section.name == SENSITIVE_APPLICATION

        # Actual application
        self.application.refresh_from_db()
        assert self.application.additional_information == SENSITIVE_APPLICATION
        assert self.application.working_memo == SENSITIVE_APPLICATION

        # Application billing address
        assert self.application.billing_address.post_code == "99999"
        assert self.application.billing_address.street_address == ANONYMIZED
        assert self.application.billing_address.street_address_fi == ANONYMIZED
        assert self.application.billing_address.street_address_en == ANONYMIZED
        assert self.application.billing_address.street_address_sv == ANONYMIZED
        assert self.application.billing_address.city == ANONYMIZED
        assert self.application.billing_address.city_fi == ANONYMIZED
        assert self.application.billing_address.city_en == ANONYMIZED
        assert self.application.billing_address.city_sv == ANONYMIZED

        # Contact person
        assert self.application.contact_person.first_name == self.mr_anonymous.first_name
        assert self.application.contact_person.last_name == self.mr_anonymous.last_name
        assert self.application.contact_person.email == self.mr_anonymous.email
        assert self.application.contact_person.phone_number == ""

        # Organisation data should not be anonymized
        assert self.application.organisation.name != ANONYMIZED
        assert self.application.organisation.identifier != "1234567-2"
        assert self.application.organisation.email != self.mr_anonymous.email
        assert self.application.organisation.core_business != ANONYMIZED
        assert self.application.organisation.core_business_fi != ANONYMIZED
        assert self.application.organisation.core_business_en != ANONYMIZED
        assert self.application.organisation.core_business_sv != ANONYMIZED

        # Organisation address should not be anonymized
        assert self.application.organisation.address.post_code != "99999"
        assert self.application.organisation.address.street_address != ANONYMIZED
        assert self.application.organisation.address.street_address_fi != ANONYMIZED
        assert self.application.organisation.address.street_address_en != ANONYMIZED
        assert self.application.organisation.address.street_address_sv != ANONYMIZED
        assert self.application.organisation.address.city != ANONYMIZED
        assert self.application.organisation.address.city_fi != ANONYMIZED
        assert self.application.organisation.address.city_en != ANONYMIZED
        assert self.application.organisation.address.city_sv != ANONYMIZED

    def test_reservation_anonymization(self):
        """Test also that the audit logger instances gets anonymized"""
        anonymize_user_reservations(self.mr_anonymous)
        self.reservation.refresh_from_db()

        assert self.reservation.name == ANONYMIZED
        assert self.reservation.description == ANONYMIZED
        assert self.reservation.reservee_first_name == self.mr_anonymous.first_name
        assert self.reservation.reservee_last_name == self.mr_anonymous.last_name
        assert self.reservation.reservee_email == self.mr_anonymous.email
        assert self.reservation.reservee_phone == ""
        assert self.reservation.reservee_address_zip == "999999"
        assert self.reservation.reservee_address_city == ANONYMIZED
        assert self.reservation.reservee_address_street == ANONYMIZED
        assert self.reservation.billing_first_name == self.mr_anonymous.first_name
        assert self.reservation.billing_last_name == self.mr_anonymous.last_name
        assert self.reservation.billing_email == self.mr_anonymous.email
        assert self.reservation.billing_phone == ""
        assert self.reservation.billing_address_zip == "99999"
        assert self.reservation.billing_address_city == ANONYMIZED
        assert self.reservation.billing_address_street == ANONYMIZED

        # Reservee_id and organisation name should not be anonymized
        assert self.reservation.reservee_id != "1234567-2"
        assert self.reservation.reservee_organisation_name != ANONYMIZED

        assert self.reservation.working_memo == ""
        assert self.reservation.free_of_charge_reason == SENSITIVE_RESERVATION
        assert self.reservation.cancel_details == SENSITIVE_RESERVATION
        assert self.reservation.handling_details == SENSITIVE_RESERVATION

        # Test that auditlog entries are wiped.
        assert LogEntry.objects.get_for_object(self.reservation).count() == 0

    def test_reservation_anonymization_does_change_empty_values(self):
        """Test also that the audit logger instances gets anonymized"""
        self.reservation.name = ""
        self.reservation.description = ""
        self.reservation.free_of_charge_reason = None
        self.reservation.save()

        anonymize_user_reservations(self.mr_anonymous)
        self.reservation.refresh_from_db()

        assert self.reservation.name == ""
        assert self.reservation.description == ""
        assert self.reservation.free_of_charge_reason is None
