import pytest

from tests.factories import ApplicationFactory, ReservationFactory, ReservationUnitFactory, UserFactory
from tilavarauspalvelu.enums import ReservationNotification
from tilavarauspalvelu.integrations.email.find_recipients import (
    get_application_email_recipients,
    get_recipients_for_applications_by_language,
    get_reservation_email_recipients,
    get_reservation_staff_notification_recipients,
)

pytestmark = [
    pytest.mark.django_db,
]


def test_get_application_email_recipients():
    user = UserFactory.create(email="applicant@example.com")
    application = ApplicationFactory.create(user=user, contact_person__email="contact@example.com")

    result = get_application_email_recipients(application)
    assert sorted(result) == ["applicant@example.com", "contact@example.com"]


def test_get_application_email_recipients__no_contact_person():
    user = UserFactory.create(email="applicant@example.com")
    application = ApplicationFactory.create(user=user, contact_person=None)

    result = get_application_email_recipients(application)
    assert result == ["applicant@example.com"]


def test_get_application_email_recipients__no_applicant():
    application = ApplicationFactory.create(user=None, contact_person__email="contact@example.com")

    result = get_application_email_recipients(application)
    assert result == ["contact@example.com"]


def test_get_application_email_recipients__no_contact_person_or_applicant():
    application = ApplicationFactory.create(user=None, contact_person=None)

    result = get_application_email_recipients(application)
    assert result == []


def test_get_reservation_email_recipients():
    user = UserFactory.create(email="user@example.com")
    reservation = ReservationFactory.create(user=user, reservee_email="reservee@example.com")

    result = get_reservation_email_recipients(reservation)
    assert sorted(result) == ["reservee@example.com", "user@example.com"]


def test_get_reservation_email_recipients__no_reservee_email():
    user = UserFactory.create(email="user@example.com")
    reservation = ReservationFactory.create(user=user, reservee_email="")

    result = get_reservation_email_recipients(reservation)
    assert sorted(result) == ["user@example.com"]


def test_get_reservation_email_recipients__no_user():
    reservation = ReservationFactory.create(user=None, reservee_email="reservee@example.com")

    result = get_reservation_email_recipients(reservation)
    assert result == ["reservee@example.com"]


def test_get_reservation_email_recipients__no_reservee_email_or_user():
    reservation = ReservationFactory.create(user=None, reservee_email="")

    result = get_reservation_email_recipients(reservation)
    assert result == []


def test_get_recipients_for_applications_by_language():
    applications = [
        ApplicationFactory.create(
            user__email="applicant1@example.com",
            user__preferred_language="fi",
            contact_person__email="contact1@example.com",
        ),
        ApplicationFactory.create(
            user__email="applicant2@example.com",
            user__preferred_language="en",
            contact_person__email="contact2@example.com",
        ),
    ]

    result = get_recipients_for_applications_by_language(applications)

    assert sorted(result["fi"]) == ["applicant1@example.com", "contact1@example.com"]
    assert sorted(result["en"]) == ["applicant2@example.com", "contact2@example.com"]
    assert sorted(result["sv"]) == []


def test_get_reservation_staff_notification_recipients__not_handling():
    reservation_unit = ReservationUnitFactory.create()

    admin_1 = UserFactory.create_with_unit_role(
        email="admin1@example.com",
        units=[reservation_unit.unit],
        reservation_notification=ReservationNotification.ALL,
    )
    UserFactory.create_with_unit_role(
        email="admin2@example.com",
        units=[reservation_unit.unit],
        reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED,
    )
    UserFactory.create(
        email="admin3@example.com",
        reservation_notification=ReservationNotification.NONE,
    )

    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    result = get_reservation_staff_notification_recipients(reservation)
    assert sorted(result) == [admin_1.email]


def test_get_reservation_staff_notification_recipients__handling():
    reservation_unit = ReservationUnitFactory.create()

    admin_1 = UserFactory.create_with_unit_role(
        email="admin1@example.com",
        units=[reservation_unit.unit],
        reservation_notification=ReservationNotification.ALL,
    )
    admin_2 = UserFactory.create_with_unit_role(
        email="admin2@example.com",
        units=[reservation_unit.unit],
        reservation_notification=ReservationNotification.ONLY_HANDLING_REQUIRED,
    )
    UserFactory.create(
        email="admin3@example.com",
        reservation_notification=ReservationNotification.NONE,
    )

    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    result = get_reservation_staff_notification_recipients(reservation, handling=True)
    assert sorted(result) == [admin_1.email, admin_2.email]


def test_get_reservation_staff_notification_recipients__dont_include_reservation_recipient():
    reservation_unit = ReservationUnitFactory.create()

    admin = UserFactory.create_with_unit_role(
        units=[reservation_unit.unit],
        reservation_notification=ReservationNotification.ALL,
    )

    reservation = ReservationFactory.create(reservation_unit=[reservation_unit], user=admin)

    result = get_reservation_staff_notification_recipients(reservation)
    assert sorted(result) == []
