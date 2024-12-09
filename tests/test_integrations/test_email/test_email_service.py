from __future__ import annotations

import datetime

import pytest
from django.test import override_settings
from freezegun import freeze_time

from tilavarauspalvelu.enums import (
    Language,
    ReservationNotification,
    ReservationStateChoice,
    ReservationTypeChoice,
    Weekday,
)
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.models.user.actions import ANONYMIZED_FIRST_NAME, ANONYMIZED_LAST_NAME
from utils.date_utils import local_datetime
from utils.sentry import SentryLogger

from tests.factories import ApplicationFactory, ApplicationRoundFactory, ReservationFactory, UnitFactory, UserFactory
from tests.helpers import TranslationsFromPOFiles, patch_method
from tests.test_graphql_api.test_recurring_reservation.helpers import create_reservation_series

pytestmark = [
    pytest.mark.django_db,
]


# type: EmailType.APPLICATION_HANDLED ##################################################################################


@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_handled_emails(outbox):
    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    application = ApplicationFactory.create_in_status_handled(application_round=application_round)

    EmailService.send_application_handled_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your application has been processed"
    assert sorted(outbox[0].bcc) == sorted([application.user.email, application.contact_person.email])


@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_handled_emails__multiple_languages(outbox):
    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    application_1 = ApplicationFactory.create_in_status_handled(
        application_round=application_round,
        user__preferred_language="fi",
    )
    application_2 = ApplicationFactory.create_in_status_handled(
        application_round=application_round,
        user__preferred_language="en",
    )

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
    ApplicationFactory.create_in_status_handled()

    EmailService.send_application_handled_emails()

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == (
        "Zero applications require the 'application handled' email to be sent"
    )


@override_settings(SEND_EMAILS=True)
@patch_method(SentryLogger.log_message)
def test_email_service__send_application_handled_emails__no_recipients(outbox):
    application_round = ApplicationRoundFactory.create_in_status_results_sent()
    ApplicationFactory.create_in_status_handled(
        application_round=application_round, user__email="", contact_person__email=""
    )

    EmailService.send_application_handled_emails()

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for application handled emails"


# type: EmailType.APPLICATION_IN_ALLOCATION ############################################################################


@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_in_allocation_emails(outbox):
    application = ApplicationFactory.create_in_status_in_allocation(in_allocation_notification_sent_date=None)

    EmailService.send_application_in_allocation_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your application is being processed"
    assert sorted(outbox[0].bcc) == sorted([application.user.email, application.contact_person.email])


@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_in_allocation_emails__already_sent(outbox):
    ApplicationFactory.create_in_status_in_allocation()

    EmailService.send_application_in_allocation_emails()

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
def test_email_service__send_application_in_allocation_emails__multiple_languages(outbox):
    application_1 = ApplicationFactory.create_in_status_in_allocation(
        user__preferred_language="fi",
        in_allocation_notification_sent_date=None,
    )
    application_2 = ApplicationFactory.create_in_status_in_allocation(
        user__preferred_language="en",
        in_allocation_notification_sent_date=None,
    )

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
    ApplicationFactory.create_in_status_in_allocation(
        user__email="",
        contact_person__email="",
        in_allocation_notification_sent_date=None,
    )

    EmailService.send_application_in_allocation_emails()

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for application in allocation emails"


# type: EmailType.APPLICATION_RECEIVED #################################################################################


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


# type: EmailType.PERMISSION_DEACTIVATION ##############################################################################


@freeze_time("2024-01-01")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_email_service__send_permission_deactivation_emails(outbox):
    UserFactory.create_superuser(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )

    EmailService.send_permission_deactivation_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your staff access to Varaamo is expiring"
    assert sorted(outbox[0].bcc) == ["user@email.com"]


@freeze_time("2024-01-01")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_email_service__send_permission_deactivation_emails__logged_in_recently(outbox):
    UserFactory.create_superuser(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=1),
    )

    EmailService.send_permission_deactivation_emails()

    assert len(outbox) == 0


@freeze_time("2024-01-01")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_email_service__send_permission_deactivation_emails__permissions_going_to_expire(outbox):
    UserFactory.create_superuser(
        email="user@email.com",
        preferred_language=Language.EN.value,
        # Logged in within `PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS`, but after `PERMISSION_NOTIFICATION_BEFORE_DAYS`
        # permissions are going to be expired, so we need to send email now.
        last_login=local_datetime() - datetime.timedelta(days=6),
    )

    EmailService.send_permission_deactivation_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your staff access to Varaamo is expiring"
    assert sorted(outbox[0].bcc) == ["user@email.com"]


@freeze_time("2024-01-01")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_email_service__send_permission_deactivation_emails__no_email(outbox):
    UserFactory.create_superuser(
        # User has no email, so we can't notify them (but we should still deactivate the permissions)
        email="",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )

    EmailService.send_permission_deactivation_emails()

    assert len(outbox) == 0


@freeze_time("2024-01-01")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_email_service__send_permission_deactivation_emails__general_admin(outbox):
    UserFactory.create_with_general_role(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )

    EmailService.send_permission_deactivation_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your staff access to Varaamo is expiring"
    assert sorted(outbox[0].bcc) == ["user@email.com"]


@freeze_time("2024-01-01")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_email_service__send_permission_deactivation_emails__general_admin__role_inactive(outbox):
    UserFactory.create_with_general_role(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
        general_roles__role_active=False,
    )

    EmailService.send_permission_deactivation_emails()

    assert len(outbox) == 0


@freeze_time("2024-01-01")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_email_service__send_permission_deactivation_emails__unit_admin(outbox):
    UserFactory.create_with_unit_role(
        units=[UnitFactory.create()],
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )

    EmailService.send_permission_deactivation_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your staff access to Varaamo is expiring"
    assert sorted(outbox[0].bcc) == ["user@email.com"]


@freeze_time("2024-01-01")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_email_service__send_permission_deactivation_emails__unit_admin__role_inactive(outbox):
    UserFactory.create_with_unit_role(
        units=[UnitFactory.create()],
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
        unit_roles__role_active=False,
    )

    EmailService.send_permission_deactivation_emails()

    assert len(outbox) == 0


@freeze_time("2024-01-01")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_email_service__send_permission_deactivation_emails__multiple_languages(outbox):
    UserFactory.create_superuser(
        email="user1@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )
    UserFactory.create_superuser(
        email="user2@email.com",
        preferred_language=Language.FI.value,
        last_login=local_datetime() - datetime.timedelta(days=25),
    )

    with TranslationsFromPOFiles():
        EmailService.send_permission_deactivation_emails()

    assert len(outbox) == 2

    assert outbox[0].subject == "Henkilökunnan käyttöoikeutesi Varaamoon on vanhentumassa"
    assert sorted(outbox[0].bcc) == ["user2@email.com"]

    assert outbox[1].subject == "Your staff access to Varaamo is expiring"
    assert sorted(outbox[1].bcc) == ["user1@email.com"]


@freeze_time("2024-01-01")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_email_service__send_permission_deactivation_emails__no_permissions(outbox):
    UserFactory.create(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )

    EmailService.send_permission_deactivation_emails()

    assert len(outbox) == 0


@freeze_time("2024-01-01")
@override_settings(SEND_EMAILS=True, PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS=10, PERMISSION_NOTIFICATION_BEFORE_DAYS=5)
def test_email_service__send_permission_deactivation_emails__email_already_sent(outbox):
    UserFactory.create_superuser(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
        sent_email_about_deactivating_permissions=True,
    )

    EmailService.send_permission_deactivation_emails()

    assert len(outbox) == 0


# type: EmailType.USER_ANONYMIZATION ###################################################################################


@freeze_time("2024-01-01")
@override_settings(
    SEND_EMAILS=True,
    ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS=10,
    ANONYMIZATION_NOTIFICATION_BEFORE_DAYS=5,
)
def test_email_service__send_user_anonymization_emails(outbox):
    UserFactory.create(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )

    EmailService.send_user_anonymization_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your user account in the Varaamo service is expiring"
    assert sorted(outbox[0].bcc) == ["user@email.com"]


@freeze_time("2024-01-01")
@override_settings(
    SEND_EMAILS=True,
    ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS=10,
    ANONYMIZATION_NOTIFICATION_BEFORE_DAYS=5,
)
def test_email_service__send_user_anonymization_emails__no_email(outbox):
    UserFactory.create(
        # User has no email, so we can't notify them (but we should still anonymize)
        email="",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )

    EmailService.send_user_anonymization_emails()

    assert len(outbox) == 0


@freeze_time("2024-01-01")
@override_settings(
    SEND_EMAILS=True,
    ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS=10,
    ANONYMIZATION_NOTIFICATION_BEFORE_DAYS=5,
)
def test_email_service__send_user_anonymization_emails__logged_in_recently(outbox):
    UserFactory.create(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=1),
    )

    EmailService.send_user_anonymization_emails()

    assert len(outbox) == 0


@freeze_time("2024-01-01")
@override_settings(
    SEND_EMAILS=True,
    ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS=10,
    ANONYMIZATION_NOTIFICATION_BEFORE_DAYS=5,
)
def test_email_service__send_user_anonymization_emails__going_to_be_old(outbox):
    UserFactory.create(
        email="user@email.com",
        preferred_language=Language.EN.value,
        # Logged in within `ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS`,
        # but after `ANONYMIZATION_NOTIFICATION_BEFORE_DAYS`
        # user will be considered inactive, so we need to send email now.
        last_login=local_datetime() - datetime.timedelta(days=6),
    )

    EmailService.send_user_anonymization_emails()

    assert len(outbox) == 1

    assert outbox[0].subject == "Your user account in the Varaamo service is expiring"
    assert sorted(outbox[0].bcc) == ["user@email.com"]


@freeze_time("2024-01-01")
@override_settings(
    SEND_EMAILS=True,
    ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS=10,
    ANONYMIZATION_NOTIFICATION_BEFORE_DAYS=5,
)
def test_email_service__send_user_anonymization_emails__already_anonymized(outbox):
    UserFactory.create(
        first_name=ANONYMIZED_FIRST_NAME,
        last_name=ANONYMIZED_LAST_NAME,
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )

    EmailService.send_user_anonymization_emails()

    assert len(outbox) == 0


@freeze_time("2024-01-01")
@override_settings(
    SEND_EMAILS=True,
    ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS=10,
    ANONYMIZATION_NOTIFICATION_BEFORE_DAYS=5,
)
def test_email_service__send_user_anonymization_emails__multiple_languages(outbox):
    UserFactory.create(
        email="user1@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
    )
    UserFactory.create(
        email="user2@email.com",
        preferred_language=Language.FI.value,
        last_login=local_datetime() - datetime.timedelta(days=25),
    )

    with TranslationsFromPOFiles():
        EmailService.send_user_anonymization_emails()

    assert len(outbox) == 2

    assert outbox[0].subject == "Käyttäjätilisi Varaamo-palveluun on vanhentumassa"
    assert sorted(outbox[0].bcc) == ["user2@email.com"]

    assert outbox[1].subject == "Your user account in the Varaamo service is expiring"
    assert sorted(outbox[1].bcc) == ["user1@email.com"]


@freeze_time("2024-01-01")
@override_settings(
    SEND_EMAILS=True,
    ANONYMIZE_USER_IF_LAST_LOGIN_IS_OLDER_THAN_DAYS=10,
    ANONYMIZATION_NOTIFICATION_BEFORE_DAYS=5,
)
def test_email_service__send_user_anonymization_emails__email_already_sent(outbox):
    UserFactory.create(
        email="user@email.com",
        preferred_language=Language.EN.value,
        last_login=local_datetime() - datetime.timedelta(days=20),
        sent_email_about_anonymization=True,
    )

    EmailService.send_user_anonymization_emails()

    assert len(outbox) == 0


# type: EmailType.RESERVATION_APPROVED #################################################################################


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_reservation_approved_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
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
        reservation_units__name="foo",
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
        reservation_units__name="foo",
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
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_approved_email(reservation)

    assert len(outbox) == 0


# type: EmailType.RESERVATION_CANCELLED ################################################################################


@override_settings(SEND_EMAILS=True)
def test_email_service__send_reservation_cancelled_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
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
        reservation_units__name="foo",
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
        reservation_units__name="foo",
    )

    EmailService.send_reservation_cancelled_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for reservation cancelled email"


# type: EmailType.RESERVATION_CONFIRMED ################################################################################


@override_settings(SEND_EMAILS=True)
def test_email_service__send_reservation_confirmed_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
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
        reservation_units__name="foo",
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
        reservation_units__name="foo",
    )

    EmailService.send_reservation_confirmed_email(reservation)

    assert len(outbox) == 0

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args[0] == "No recipients for reservation confirmed email"


# type: EmailType.RESERVATION_MODIFIED #################################################################################


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_reservation_modified_email(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
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
        reservation_units__name="foo",
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
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_modified_email(reservation)

    assert len(outbox) == 0


# type: EmailType.RESERVATION_REJECTED #################################################################################


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_reservation_rejected_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.NORMAL,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
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
        reservation_units__name="foo",
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
        reservation_units__name="foo",
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
        reservation_units__name="foo",
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
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_rejected_email(reservation)

    assert len(outbox) == 0


# type: EmailType.RESERVATION_REQUIRES_HANDLING ########################################################################


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_reservation_requires_handling_email(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        reservation_units__pricings__lowest_price=0,
        reservation_units__pricings__highest_price=0,
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
        reservation_units__name="foo",
        reservation_units__pricings__lowest_price=0,
        reservation_units__pricings__highest_price=0,
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
        reservation_units__name="foo",
        reservation_units__pricings__lowest_price=0,
        reservation_units__pricings__highest_price=0,
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
        reservation_units__name="foo",
        reservation_units__pricings__lowest_price=0,
        reservation_units__pricings__highest_price=0,
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_requires_handling_email(reservation)

    assert len(outbox) == 0


# type: EmailType.RESERVATION_REQUIRES_PAYMENT #########################################################################


@override_settings(SEND_EMAILS=True)
def test_email_service__send_reservation_requires_payment_email(outbox):
    reservation = ReservationFactory.create(
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
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
        reservation_units__name="foo",
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
        reservation_units__name="foo",
        price=0,
    )

    EmailService.send_reservation_requires_payment_email(reservation)

    assert len(outbox) == 0


# type: EmailType.SEASONAL_RESERVATION_CANCELLED_SINGLE ################################################################


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_seasonal_reservation_cancelled_single(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        type=ReservationTypeChoice.SEASONAL,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_cancelled_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "The space reservation included in your seasonal booking has been cancelled"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


# type: EmailType.SEASONAL_RESERVATION_MODIFIED_SERIES #################################################################


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_seasonal_reservation_modified_series(outbox):
    reservation_series = create_reservation_series(
        user__email="user@email.com",
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservations__reservee_email="reservee@email.com",
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
    )

    EmailService.send_seasonal_reservation_modified_series_email(reservation_series=reservation_series)

    assert len(outbox) == 1

    assert outbox[0].subject == "The time of the space reservation included in your seasonal booking has changed"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_seasonal_reservation_modified_series__email_not_sent__no_allocated_time_slot(outbox):
    reservation_series = create_reservation_series(
        user__email="user@email.com",
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservations__reservee_email="reservee@email.com",
        allocated_time_slot=None,
    )

    EmailService.send_seasonal_reservation_modified_series_email(reservation_series=reservation_series)

    assert len(outbox) == 0


# type: EmailType.SEASONAL_RESERVATION_MODIFIED_SINGLE #################################################################


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_seasonal_reservation_modified_single(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.SEASONAL,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_modified_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "The time of the space reservation included in your seasonal booking has changed"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


# type: EmailType.SEASONAL_RESERVATION_REJECTED_SERIES #################################################################


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_seasonal_reservation_rejected_series(outbox):
    reservation_series = create_reservation_series(
        user__email="user@email.com",
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservations__reservee_email="reservee@email.com",
        allocated_time_slot__day_of_the_week=Weekday.MONDAY,
    )

    EmailService.send_seasonal_reservation_rejected_series_email(reservation_series=reservation_series)

    assert len(outbox) == 1

    assert outbox[0].subject == "Your seasonal booking has been cancelled"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_seasonal_reservation_rejected_series__email_not_sent__no_allocated_time_slot(outbox):
    reservation_series = create_reservation_series(
        user__email="user@email.com",
        reservations__type=ReservationTypeChoice.SEASONAL,
        reservations__reservee_email="reservee@email.com",
        allocated_time_slot=None,
    )

    EmailService.send_seasonal_reservation_rejected_series_email(reservation_series=reservation_series)

    assert len(outbox) == 0


# type: EmailType.SEASONAL_RESERVATION_REJECTED_SINGLE #################################################################


@override_settings(SEND_EMAILS=True)
@freeze_time("2024-01-01")
def test_email_service__send_seasonal_reservation_rejected_single(outbox):
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.DENIED,
        type=ReservationTypeChoice.SEASONAL,
        reservee_email="reservee@email.com",
        user__email="user@email.com",
        reservation_units__name="foo",
        begin=datetime.datetime(2024, 1, 1, 10, 0),
        end=datetime.datetime(2024, 1, 1, 12, 0),
    )

    EmailService.send_reservation_rejected_email(reservation)

    assert len(outbox) == 1

    assert outbox[0].subject == "The space reservation included in your seasonal booking has been cancelled"
    assert sorted(outbox[0].bcc) == ["reservee@email.com", "user@email.com"]


# type: EmailType.STAFF_NOTIFICATION_RESERVATION_MADE ##################################################################


@override_settings(SEND_EMAILS=True)
def test_email_service__send_staff_notification_reservation_made_email(outbox):
    unit = UnitFactory.create(name_en="foo")

    UserFactory.create_with_unit_role(
        units=[unit],
        email="admin@email.com",
        reservation_notification=ReservationNotification.ALL,
        preferred_language="en",
    )

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservation_units__unit=unit,
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
        reservation_units__unit=unit,
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
        preferred_language="en",
    )

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        reservation_units__unit=unit,
    )

    EmailService.send_staff_notification_reservation_made_email(reservation)

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
def test_email_service__send_staff_notification_reservation_made_email__multiple_recipients(outbox):
    unit = UnitFactory.create(name="foo", name_en="foo")

    UserFactory.create_with_unit_role(
        units=[unit],
        email="admin1@email.com",
        reservation_notification=ReservationNotification.ALL,
        preferred_language="fi",
    )

    UserFactory.create_with_unit_role(
        units=[unit],
        email="admin2@email.com",
        reservation_notification=ReservationNotification.ALL,
        preferred_language="en",
    )

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        reservation_units__unit=unit,
    )

    with TranslationsFromPOFiles():
        EmailService.send_staff_notification_reservation_made_email(reservation)

    assert len(outbox) == 2

    assert outbox[0].subject == f"Toimipisteeseen foo on tehty uusi tilavaraus {reservation.id}"
    assert sorted(outbox[0].bcc) == ["admin1@email.com"]

    assert outbox[1].subject == f"New booking {reservation.id} has been made for foo"
    assert sorted(outbox[1].bcc) == ["admin2@email.com"]


# type: EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING #####################################################


@override_settings(SEND_EMAILS=True)
def test_email_service__send_staff_notification_reservation_requires_handling_email(outbox):
    unit = UnitFactory.create(name_en="foo")

    UserFactory.create_with_unit_role(
        units=[unit],
        email="admin@email.com",
        reservation_notification=ReservationNotification.ALL,
        preferred_language="en",
    )

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_units__unit=unit,
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
        reservation_units__unit=unit,
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
        preferred_language="en",
    )

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CANCELLED,
        reservation_units__unit=unit,
    )

    EmailService.send_staff_notification_reservation_requires_handling_email(reservation)

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
def test_email_service__send_staff_notification_reservation_requires_handling_email__multiple_recipients(outbox):
    unit = UnitFactory.create(name="foo", name_en="foo")

    UserFactory.create_with_unit_role(
        units=[unit],
        email="admin1@email.com",
        reservation_notification=ReservationNotification.ALL,
        preferred_language="fi",
    )

    UserFactory.create_with_unit_role(
        units=[unit],
        email="admin2@email.com",
        reservation_notification=ReservationNotification.ALL,
        preferred_language="en",
    )

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.REQUIRES_HANDLING,
        reservation_units__unit=unit,
    )

    with TranslationsFromPOFiles():
        EmailService.send_staff_notification_reservation_requires_handling_email(reservation)

    assert len(outbox) == 2

    assert outbox[0].subject == f"Uusi tilavaraus {reservation.id} odottaa käsittelyä toimipisteessä foo"
    assert sorted(outbox[0].bcc) == ["admin1@email.com"]

    assert outbox[1].subject == f"New booking {reservation.id} requires handling at unit foo"
    assert sorted(outbox[1].bcc) == ["admin2@email.com"]
