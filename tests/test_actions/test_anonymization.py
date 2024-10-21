import datetime
import uuid

import pytest
from auditlog.models import LogEntry
from django.test import override_settings
from freezegun import freeze_time
from social_django.models import UserSocialAuth

from tests.factories import (
    AddressFactory,
    ApplicationFactory,
    ApplicationSectionFactory,
    PaymentOrderFactory,
    ReservationFactory,
    UnitFactory,
    UserFactory,
    UserSocialAuthFactory,
)
from tilavarauspalvelu.enums import OrderStatus, ReservationNotification
from tilavarauspalvelu.models import GeneralRole, UnitRole, User
from tilavarauspalvelu.models.user.actions import (
    ANONYMIZED,
    ANONYMIZED_FIRST_NAME,
    ANONYMIZED_LAST_NAME,
    SENSITIVE_APPLICATION,
    SENSITIVE_RESERVATION,
)
from utils.date_utils import local_datetime

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_anonymization__user():
    mr_anonymous = UserFactory.create_superuser(
        username="anonym",
        first_name="anony",
        last_name="mous",
        email="anony.mous@foo.com",
        reservation_notification=ReservationNotification.ALL,
        profile_id="mouse",
    )
    UserSocialAuthFactory.create(user=mr_anonymous)

    # Add general role
    GeneralRole.objects.create(user=mr_anonymous)

    # Add unit role
    unit = UnitFactory(name="Role testing unit")
    unit_role = UnitRole.objects.create(user=mr_anonymous)
    unit_role.units.add(unit)

    old_user_uuid = mr_anonymous.uuid

    mr_anonymous.actions.anonymize_user()
    mr_anonymous.refresh_from_db()

    assert mr_anonymous.username == f"anonymized-{mr_anonymous.uuid}"
    assert mr_anonymous.first_name == ANONYMIZED_FIRST_NAME
    assert mr_anonymous.last_name == ANONYMIZED_LAST_NAME
    assert mr_anonymous.email == f"{mr_anonymous.first_name}.{mr_anonymous.last_name}@anonymized.net"
    assert mr_anonymous.uuid != old_user_uuid
    assert mr_anonymous.reservation_notification == ReservationNotification.NONE
    assert mr_anonymous.is_active is False
    assert mr_anonymous.is_superuser is False
    assert mr_anonymous.is_staff is False
    assert mr_anonymous.profile_id == ""

    assert GeneralRole.objects.filter(user=mr_anonymous).count() == 0
    assert UnitRole.objects.filter(user=mr_anonymous).count() == 0
    assert UserSocialAuth.objects.filter(user=mr_anonymous).count() == 0


def test_anonymization__application():
    mr_anonymous = UserFactory.create_superuser(
        username="anonym",
        first_name="anony",
        last_name="mous",
        email="anony.mous@foo.com",
        reservation_notification=ReservationNotification.ALL,
    )
    billing_address = AddressFactory()
    application = ApplicationFactory.create(user=mr_anonymous, billing_address=billing_address)
    app_section = ApplicationSectionFactory.create(application=application)

    mr_anonymous.actions.anonymize_user_applications()
    app_section.refresh_from_db()

    # Section
    assert app_section.name == SENSITIVE_APPLICATION

    # Actual application
    application.refresh_from_db()
    assert application.additional_information == SENSITIVE_APPLICATION
    assert application.working_memo == SENSITIVE_APPLICATION

    # Application billing address
    assert application.billing_address.post_code == "99999"
    assert application.billing_address.street_address == ANONYMIZED
    assert application.billing_address.street_address_fi == ANONYMIZED
    assert application.billing_address.street_address_en == ANONYMIZED
    assert application.billing_address.street_address_sv == ANONYMIZED
    assert application.billing_address.city == ANONYMIZED
    assert application.billing_address.city_fi == ANONYMIZED
    assert application.billing_address.city_en == ANONYMIZED
    assert application.billing_address.city_sv == ANONYMIZED

    # Contact person
    assert application.contact_person.first_name == mr_anonymous.first_name
    assert application.contact_person.last_name == mr_anonymous.last_name
    assert application.contact_person.email == mr_anonymous.email
    assert application.contact_person.phone_number == ""

    # Organisation data should not be anonymized
    assert application.organisation.name != ANONYMIZED
    assert application.organisation.identifier != "1234567-2"
    assert application.organisation.email != mr_anonymous.email
    assert application.organisation.core_business != ANONYMIZED
    assert application.organisation.core_business_fi != ANONYMIZED
    assert application.organisation.core_business_en != ANONYMIZED
    assert application.organisation.core_business_sv != ANONYMIZED

    # Organisation address should not be anonymized
    assert application.organisation.address.post_code != "99999"
    assert application.organisation.address.street_address != ANONYMIZED
    assert application.organisation.address.street_address_fi != ANONYMIZED
    assert application.organisation.address.street_address_en != ANONYMIZED
    assert application.organisation.address.street_address_sv != ANONYMIZED
    assert application.organisation.address.city != ANONYMIZED
    assert application.organisation.address.city_fi != ANONYMIZED
    assert application.organisation.address.city_en != ANONYMIZED
    assert application.organisation.address.city_sv != ANONYMIZED


def test_anonymization__reservation():
    mr_anonymous = UserFactory.create_superuser(
        username="anonym",
        first_name="anony",
        last_name="mous",
        email="anony.mous@foo.com",
        reservation_notification=ReservationNotification.ALL,
    )
    reservation = ReservationFactory.create(
        user=mr_anonymous,
        reservee_address_zip="0100",
        reservee_address_city="Helsinki",
        reservee_address_street="Test Address 1",
        billing_address_zip="01000",
        billing_address_city="Helsinki",
        billing_address_street="Test Address 1",
        free_of_charge_reason="Test reason",
        cancel_details="Test cancel details",
        handling_details="Test handling details",
        recurring_reservation__name="foo",
        recurring_reservation__description="bar",
    )

    mr_anonymous.actions.anonymize_user_reservations()
    reservation.refresh_from_db()

    assert reservation.name == ANONYMIZED
    assert reservation.description == ANONYMIZED
    assert reservation.reservee_first_name == mr_anonymous.first_name
    assert reservation.reservee_last_name == mr_anonymous.last_name
    assert reservation.reservee_email == mr_anonymous.email
    assert reservation.reservee_phone == ""
    assert reservation.reservee_address_zip == "99999"
    assert reservation.reservee_address_city == ANONYMIZED
    assert reservation.reservee_address_street == ANONYMIZED
    assert reservation.billing_first_name == mr_anonymous.first_name
    assert reservation.billing_last_name == mr_anonymous.last_name
    assert reservation.billing_email == mr_anonymous.email
    assert reservation.billing_phone == ""
    assert reservation.billing_address_zip == "99999"
    assert reservation.billing_address_city == ANONYMIZED
    assert reservation.billing_address_street == ANONYMIZED

    # Reservee_id and organisation name should not be anonymized
    assert reservation.reservee_id != "1234567-2"
    assert reservation.reservee_organisation_name != ANONYMIZED

    assert reservation.working_memo == ""
    assert reservation.free_of_charge_reason == SENSITIVE_RESERVATION
    assert reservation.cancel_details == SENSITIVE_RESERVATION
    assert reservation.handling_details == SENSITIVE_RESERVATION

    assert reservation.recurring_reservation.name == ANONYMIZED
    assert reservation.recurring_reservation.description == ANONYMIZED

    # Check that auditlog entries are removed also
    assert LogEntry.objects.get_for_object(reservation).count() == 0


@freeze_time("2024-01-01")
def test_anonymization__can_anonymize__open_reservations():
    user = UserFactory.create(first_name="foo")

    now = local_datetime()
    ReservationFactory.create(user=user, begin=now, end=now + datetime.timedelta(days=1))

    can_anonymize = user.actions.can_anonymize()

    assert can_anonymize.has_open_reservations is True
    assert can_anonymize.has_open_applications is False
    assert can_anonymize.has_open_payments is False


def test_anonymization__can_anonymize__open_applications__received():
    user = UserFactory.create(first_name="foo")

    ApplicationFactory.create_in_status_received(user=user)

    can_anonymize = user.actions.can_anonymize()

    assert can_anonymize.has_open_reservations is False
    assert can_anonymize.has_open_applications is True
    assert can_anonymize.has_open_payments is False


def test_anonymization__can_anonymize__open_applications__in_allocation():
    user = UserFactory.create(first_name="foo")

    ApplicationFactory.create_in_status_in_allocation(user=user)

    can_anonymize = user.actions.can_anonymize()

    assert can_anonymize.has_open_reservations is False
    assert can_anonymize.has_open_applications is True
    assert can_anonymize.has_open_payments is False


def test_anonymization__can_anonymize__open_payments():
    user = UserFactory.create(first_name="foo")

    PaymentOrderFactory.create(
        reservation__user=user,
        remote_id=uuid.uuid4(),
        status=OrderStatus.DRAFT,
    )

    can_anonymize = user.actions.can_anonymize()

    assert can_anonymize.has_open_reservations is False
    assert can_anonymize.has_open_applications is False
    assert can_anonymize.has_open_payments is True


@freeze_time("2024-01-01")
@override_settings(ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS=10)
def test_anonymization__anonymize_inactive_users():
    now = local_datetime()

    user_1 = UserFactory.create(first_name="foo", last_login=now - datetime.timedelta(days=11))
    user_2 = UserFactory.create(first_name="bar", last_login=now - datetime.timedelta(days=11))
    user_3 = UserFactory.create(first_name="baz", last_login=now - datetime.timedelta(days=10))

    # User 2 cannot be anonymized, since it has open reservations
    ReservationFactory.create(user=user_2, begin=now, end=now + datetime.timedelta(days=1))

    User.objects.anonymize_inactive_users()

    user_1.refresh_from_db()
    user_2.refresh_from_db()
    user_3.refresh_from_db()

    assert user_1.first_name == ANONYMIZED_FIRST_NAME
    assert user_2.first_name == "bar"
    assert user_3.first_name == "baz"
