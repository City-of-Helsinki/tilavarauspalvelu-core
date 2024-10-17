import datetime

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tests.factories import ApplicationFactory, ReservationFactory, UnitFactory, UserFactory
from tests.helpers import TranslationsFromPOFiles, patch_method
from tilavarauspalvelu.enums import Language, ReservationNotification, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from utils.sentry import SentryLogger

pytestmark = [
    pytest.mark.django_db,
]


@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_received_email(outbox):
    application = ApplicationFactory.create_in_status_received()

    EmailService.send_application_received_email(application=application)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your application has been received"
    assert sorted(outbox[0].bcc) == sorted([application.user.email, application.contact_person.email])


@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_received_email__wrong_status(outbox):
    application = ApplicationFactory.create_in_status_draft()

    EmailService.send_application_received_email(application=application)

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_email_service__send_application_received_email__no_recipients(outbox):
    application = ApplicationFactory.create_in_status_received(user__email="", contact_person__email="")

    EmailService.send_application_received_email(application=application)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for application received email"


@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_in_allocation_emails(outbox):
    application = ApplicationFactory.create_in_status_in_allocation()

    EmailService.send_application_in_allocation_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your application is being processed"
    assert sorted(outbox[0].bcc) == sorted([application.user.email, application.contact_person.email])


@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_in_allocation_emails__multiple_languages(outbox):
    application_1 = ApplicationFactory.create_in_status_in_allocation(user__preferred_language="fi")
    application_2 = ApplicationFactory.create_in_status_in_allocation(user__preferred_language="en")

    with TranslationsFromPOFiles():
        EmailService.send_application_in_allocation_emails()

    assert len(outbox) == 2

    assert outbox[0].subject == "Hakemustasi käsitellään"
    assert sorted(outbox[0].bcc) == sorted([application_1.user.email, application_1.contact_person.email])

    assert outbox[1].subject == "Your application is being processed"
    assert sorted(outbox[1].bcc) == sorted([application_2.user.email, application_2.contact_person.email])


@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_in_allocation_emails__wrong_status(outbox):
    ApplicationFactory.create_in_status_expired()

    EmailService.send_application_in_allocation_emails()

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_email_service__send_application_in_allocation_emails__no_recipients(outbox):
    ApplicationFactory.create_in_status_in_allocation(user__email="", contact_person__email="")

    EmailService.send_application_in_allocation_emails()

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for application in allocation emails"


@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_handled_emails(outbox):
    application = ApplicationFactory.create_in_status_handled()

    EmailService.send_application_handled_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your application has been processed"
    assert sorted(outbox[0].bcc) == sorted([application.user.email, application.contact_person.email])


@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_handled_emails__multiple_languages(outbox):
    application_1 = ApplicationFactory.create_in_status_handled(user__preferred_language="fi")
    application_2 = ApplicationFactory.create_in_status_handled(user__preferred_language="en")

    with TranslationsFromPOFiles():
        EmailService.send_application_handled_emails()

    assert len(outbox) == 2

    assert outbox[0].subject == "Hakemuksesi on käsitelty"
    assert sorted(outbox[0].bcc) == sorted([application_1.user.email, application_1.contact_person.email])

    assert outbox[1].subject == "Your application has been processed"
    assert sorted(outbox[1].bcc) == sorted([application_2.user.email, application_2.contact_person.email])


@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_email_service__send_application_handled_emails__wrong_status(outbox):
    ApplicationFactory.create_in_status_in_allocation()

    EmailService.send_application_handled_emails()

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == (
        "Zero applications require the 'application handled' email to be sent"
    )


@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_email_service__send_application_handled_emails__no_recipients(outbox):
    ApplicationFactory.create_in_status_handled(user__email="", contact_person__email="")

    EmailService.send_application_handled_emails()

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for application handled emails"


@override_settings(SEND_EMAILS=True)
def test_email_service__send_permission_deactivation_email(outbox):
    user = UserFactory.create_superuser(email="user@email.com", preferred_language=Language.EN.value)

    EmailService.send_permission_deactivation_email(user)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your permissions in Varaamo are going to be deactivated"
    assert sorted(outbox[0].bcc) == ["user@email.com"]


@override_settings(SEND_EMAILS=True)
def test_email_service__send_permission_deactivation_email__no_permissions(outbox):
    user = UserFactory.create(email="user@email.com", preferred_language=Language.EN.value)

    EmailService.send_permission_deactivation_email(user)

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
def test_email_service__send_reservation_cancelled_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
    )

    EmailService.send_reservation_cancelled_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your booking has been cancelled"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


@override_settings(SEND_EMAILS=True)
def test_email_service__send_reservation_cancelled_email__wrong_state(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
    )

    EmailService.send_reservation_cancelled_email(reservation)

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_email_service__send_reservation_cancelled_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        reservee_email="",
        user__email="",
        reservation_unit__name="foo",
    )

    EmailService.send_reservation_cancelled_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for reservation cancelled email"


@override_settings(SEND_EMAILS=True)
def test_email_service__send_reservation_confirmed_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
    )

    EmailService.send_reservation_confirmed_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Thank you for your booking at Varaamo"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]

    assert len(outbox[0].attachments) == 1
    assert outbox[0].attachments[0][0] == "reservation_calendar.ics"


@override_settings(SEND_EMAILS=True)
def test_email_service__send_reservation_confirmed_email__wrong_state(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
    )

    EmailService.send_reservation_confirmed_email(reservation)

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_email_service__send_reservation_confirmed_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservee_email="",
        user__email="",
        reservation_unit__name="foo",
    )

    EmailService.send_reservation_confirmed_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for reservation confirmed email"


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_reservation_approved_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_approved_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your booking is confirmed"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]

    assert len(outbox[0].attachments) == 1
    assert outbox[0].attachments[0][0] == "reservation_calendar.ics"


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_reservation_approved_email__wrong_state(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_approved_email(reservation)

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
@patch_method(SentryLogger.log_message)
def test_email_service__send_reservation_approved_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservee_email="",
        user__email="",
        reservation_unit__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_approved_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for reservation approved email"


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-02")
def test_email_service__send_reservation_approved_email__reservation_in_the_past(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_approved_email(reservation)

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_reservation_requires_handling_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        reservation_unit__pricings__lowest_price=0,
        reservation_unit__pricings__highest_price=0,
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_requires_handling_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your booking is waiting for processing"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_reservation_requires_handling_email__wrong_state(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        reservation_unit__pricings__lowest_price=0,
        reservation_unit__pricings__highest_price=0,
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_requires_handling_email(reservation)

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
@patch_method(SentryLogger.log_message)
def test_email_service__send_reservation_requires_handling_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservee_email="",
        user__email="",
        reservation_unit__name="foo",
        reservation_unit__pricings__lowest_price=0,
        reservation_unit__pricings__highest_price=0,
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_requires_handling_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for reservation requires handling email"


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-02")
def test_email_service__send_reservation_requires_handling_email__reservation_in_the_past(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        reservation_unit__pricings__lowest_price=0,
        reservation_unit__pricings__highest_price=0,
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_requires_handling_email(reservation)

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_reservation_modified_email(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_modified_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your booking has been updated"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]

    assert len(outbox[0].attachments) == 1
    assert outbox[0].attachments[0][0] == "reservation_calendar.ics"


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
@patch_method(SentryLogger.log_message)
def test_email_service__send_reservation_modified_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        reservee_email="",
        user__email="",
        reservation_unit__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_modified_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for reservation modified email"


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-02")
def test_email_service__send_reservation_modified_email__reservation_in_the_past(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_modified_email(reservation)

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
def test_email_service__send_reservation_requires_payment_email(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        price=1,
    )

    EmailService.send_reservation_requires_payment_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your booking has been confirmed, and can be paid"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_email_service__send_reservation_requires_payment_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        reservee_email="",
        user__email="",
        reservation_unit__name="foo",
        price=1,
    )

    EmailService.send_reservation_requires_payment_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for reservation requires payment email"


@override_settings(SEND_EMAILS=True)
def test_email_service__send_reservation_requires_payment_email__price_zero(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        price=0,
    )

    EmailService.send_reservation_requires_payment_email(reservation)

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_reservation_rejected_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.NORMAL,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_rejected_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "Unfortunately your booking cannot be confirmed"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
@patch_method(SentryLogger.log_message)
def test_email_service__send_reservation_rejected_email__no_recipients(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.NORMAL,
        reservee_email="",
        user__email="",
        reservation_unit__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_rejected_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for reservation rejected email"


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_reservation_rejected_email__wrong_state(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        type=ReservationTypeChoice.NORMAL,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_rejected_email(reservation)

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-02")
def test_email_service__send_reservation_rejected_email__reservation_in_the_past(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.NORMAL,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_rejected_email(reservation)

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-02")
def test_email_service__send_reservation_rejected_email__no_normal_reservation(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.BEHALF,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_unit__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_rejected_email(reservation)

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
def test_email_service__send_staff_notification_reservation_made_email(outbox):
    unit = UnitFactory.create(name="foo")

    UserFactory.create_with_unit_role(
        units=[unit],
        email="admin@email.com",
        reservation_notification=ReservationNotification.ALL,
    )

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit__unit=unit,
    )

    EmailService.send_staff_notification_reservation_made_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == f"New booking {reservation.id} has been made for foo"
    assert sorted(outbox[0].bcc) == ["admin@email.com"]


@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_email_service__send_staff_notification_reservation_made_email__no_recipients(outbox):
    unit = UnitFactory.create(name="foo")

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservation_unit__unit=unit,
    )

    EmailService.send_staff_notification_reservation_made_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for staff notification reservation made email"


@override_settings(SEND_EMAILS=True)
def test_email_service__send_staff_notification_reservation_made_email__wrong_state(outbox):
    unit = UnitFactory.create(name="foo")

    UserFactory.create_with_unit_role(
        units=[unit],
        reservation_notification=ReservationNotification.ALL,
    )

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        reservation_unit__unit=unit,
    )

    EmailService.send_staff_notification_reservation_made_email(reservation)

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
def test_email_service__send_staff_notification_reservation_requires_handling_email(outbox):
    unit = UnitFactory.create(name="foo")

    UserFactory.create_with_unit_role(
        units=[unit],
        email="admin@email.com",
        reservation_notification=ReservationNotification.ALL,
    )

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit__unit=unit,
    )

    EmailService.send_staff_notification_reservation_requires_handling_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == f"New booking {reservation.id} requires handling at unit foo"
    assert sorted(outbox[0].bcc) == ["admin@email.com"]


@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_email_service__send_staff_notification_reservation_requires_handling_email__no_recipients(outbox):
    unit = UnitFactory.create(name="foo")

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_unit__unit=unit,
    )

    EmailService.send_staff_notification_reservation_requires_handling_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == (
        "No recipients for staff notification reservation requires handling email"
    )


@override_settings(SEND_EMAILS=True)
def test_email_service__send_staff_notification_reservation_requires_handling_email__wrong_state(outbox):
    unit = UnitFactory.create(name="foo")

    UserFactory.create_with_unit_role(
        units=[unit],
        email="admin@email.com",
        reservation_notification=ReservationNotification.ALL,
    )

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        reservation_unit__unit=unit,
    )

    EmailService.send_staff_notification_reservation_requires_handling_email(reservation)

    assert len(outbox) == 0
