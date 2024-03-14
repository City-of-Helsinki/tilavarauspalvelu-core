import datetime
import urllib.parse
from typing import Literal

import freezegun
import pytest
from django.utils.timezone import get_default_timezone

from email_notification.exceptions import EmailBuilderConfigError
from email_notification.models import EmailTemplate, EmailType
from email_notification.sender.email_notification_builder import ReservationEmailNotificationBuilder
from reservations.choices import CustomerTypeChoice
from reservations.models import Reservation
from tests.factories import (
    EmailTemplateFactory,
    LocationFactory,
    ReservationCancelReasonFactory,
    ReservationDenyReasonFactory,
    ReservationFactory,
    ReservationUnitFactory,
)

pytestmark = [
    pytest.mark.django_db,
]

type LanguageLiteral = Literal["fi", "en", "sv"]


@pytest.fixture()
def email_template() -> EmailTemplate:
    return EmailTemplateFactory.create(
        type=EmailType.RESERVATION_CONFIRMED,
        content="This is the {{ reservation_number }} content",
        content_en="This is the {{ reservation_number }} content in english",
        content_sv="This is the {{ reservation_number }} content in swedish",
        subject="This is the subject {{ name }}",
        subject_en="This is the subject {{ name }} in english",
        subject_sv="This is the subject {{ name }} in swedish",
    )


def get_email_builder(
    email_template: EmailTemplate,
    reservation: Reservation,
    *,
    language: LanguageLiteral | None = None,
) -> ReservationEmailNotificationBuilder:
    builder = ReservationEmailNotificationBuilder(reservation, email_template)
    if language is not None:
        builder._set_language(language)
    return builder


@pytest.mark.parametrize(
    ("reservee_type", "expected"),
    [
        (CustomerTypeChoice.INDIVIDUAL, "Human Person"),
        (CustomerTypeChoice.BUSINESS, "Organisation"),
        (CustomerTypeChoice.NONPROFIT, "Organisation"),
    ],
)
def test_email_builder__get_reservee_name__reservee_type_individual(reservee_type, expected, email_template):
    reservation = ReservationFactory.create(
        reservee_type=reservee_type,
        reservee_first_name="Human",
        reservee_last_name="Person",
        reservee_organisation_name="Organisation",
    )

    builder = get_email_builder(email_template, reservation)

    assert builder._get_reservee_name() == expected


@pytest.mark.parametrize(
    ("value", "result_date", "result_time"),
    [
        (datetime.datetime(2021, 1, 1, 23, 0), "1.1.2021", "23:00"),
        (datetime.datetime(2021, 1, 1, 23, 0, tzinfo=datetime.UTC), "2.1.2021", "01:00"),
    ],
)
def test_email_builder__get_begin_date_and_time(value, result_date, result_time, email_template):
    reservation = ReservationFactory.create(begin=value)

    builder = get_email_builder(email_template, reservation)

    assert builder._get_begin_date() == result_date
    assert builder._get_begin_time() == result_time


@pytest.mark.parametrize(
    ("value", "result_date", "result_time"),
    [
        (datetime.datetime(2021, 1, 1, 23, 0), "1.1.2021", "23:00"),
        (datetime.datetime(2021, 1, 1, 23, 0, tzinfo=datetime.UTC), "2.1.2021", "01:00"),
    ],
)
def test_email_builder__get_end_date_and_time(value, result_date, result_time, email_template):
    reservation = ReservationFactory.create(end=value)

    builder = get_email_builder(email_template, reservation)

    assert builder._get_end_date() == result_date
    assert builder._get_end_time() == result_time


def test_email_builder__get_reservation_number(email_template):
    reservation = ReservationFactory.create()

    builder = get_email_builder(email_template, reservation)

    assert builder._get_reservation_number() == reservation.id


def test_email_builder__get_unit_location(email_template):
    reservation_unit = ReservationUnitFactory.create()
    location = LocationFactory.create(unit=reservation_unit.unit)
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation)

    assert builder._get_unit_location() == f"{location.address_street}, {location.address_zip} {location.address_city}"


def test_email_builder__get_unit_name(email_template):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation)

    assert builder._get_unit_name() == reservation_unit.unit.name


def test_email_builder__get_reservation_unit__single(email_template):
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation)

    assert builder._get_reservation_unit() == reservation_unit.name


def test_email_builder__get_reservation_unit__multiple(email_template):
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit_1, reservation_unit_2])

    builder = get_email_builder(email_template, reservation)

    assert builder._get_reservation_unit() == f"{reservation_unit_1.name}, {reservation_unit_2.name}"


def test_email_builder__get_price(email_template):
    reservation = ReservationFactory.create()

    builder = get_email_builder(email_template, reservation)

    assert builder._get_price() == reservation.price


def test_email_builder__get_non_subsidised_price(email_template):
    reservation = ReservationFactory.create()

    builder = get_email_builder(email_template, reservation)

    assert builder._get_non_subsidised_price() == reservation.non_subsidised_price


def test_email_builder__get_tax_percentage(email_template):
    reservation = ReservationFactory.create()

    builder = get_email_builder(email_template, reservation)

    assert builder._get_tax_percentage() == reservation.tax_percentage_value


@freezegun.freeze_time("2021-01-01T12:00:00+02:00")
def test_email_builder__get_current_year(email_template):
    reservation = ReservationFactory.create()

    builder = get_email_builder(email_template, reservation)

    assert builder._get_current_year() == datetime.datetime.now(tz=get_default_timezone()).year


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_email_builder__get_confirmed_instructions__fi(language: LanguageLiteral, email_template):
    reservation_unit = ReservationUnitFactory.create(
        reservation_confirmed_instructions_fi="foo",
        reservation_confirmed_instructions_en="bar",
        reservation_confirmed_instructions_sv="baz",
    )
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation, language=language)

    attr = f"reservation_confirmed_instructions_{language}"
    assert builder._get_confirmed_instructions() == getattr(reservation_unit, attr)


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_email_builder__get_pending_instructions(language: LanguageLiteral, email_template):
    reservation_unit = ReservationUnitFactory.create(
        reservation_pending_instructions_fi="foo",
        reservation_pending_instructions_en="bar",
        reservation_pending_instructions_sv="baz",
    )
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation, language=language)

    attr = f"reservation_pending_instructions_{language}"
    assert builder._get_pending_instructions() == getattr(reservation_unit, attr)


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_email_builder__get_cancelled_instructions(language: LanguageLiteral, email_template):
    reservation_unit = ReservationUnitFactory.create(
        reservation_cancelled_instructions_fi="foo",
        reservation_cancelled_instructions_en="bar",
        reservation_cancelled_instructions_sv="baz",
    )
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation, language=language)

    attr = f"reservation_cancelled_instructions_{language}"
    assert builder._get_cancelled_instructions() == getattr(reservation_unit, attr)


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_email_builder__get_deny_reason(language: LanguageLiteral, email_template):
    deny_reason = ReservationDenyReasonFactory.create(
        reason_fi="foo",
        reason_en="bar",
        reason_sv="baz",
    )
    reservation = ReservationFactory.create(deny_reason=deny_reason)

    builder = get_email_builder(email_template, reservation, language=language)

    assert builder._get_deny_reason() == getattr(deny_reason, f"reason_{language}")


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_email_builder__get_cancel_reason(language: LanguageLiteral, email_template):
    cancel_reason = ReservationCancelReasonFactory.create(
        reason_fi="foo",
        reason_en="bar",
        reason_sv="baz",
    )
    reservation = ReservationFactory.create(cancel_reason=cancel_reason)

    builder = get_email_builder(email_template, reservation, language=language)

    assert builder._get_cancel_reason() == getattr(cancel_reason, f"reason_{language}")


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_email_builder__get_reservations_ext_link(language: LanguageLiteral, settings, email_template):
    settings.EMAIL_VARAAMO_EXT_LINK = link = "https://varaamo.hel.fi"

    reservation = ReservationFactory.create()

    builder = get_email_builder(email_template, reservation, language=language)

    lang_part = f"/{language}" if language != "fi" else ""
    assert builder._get_my_reservations_ext_link() == f"{link}{lang_part}/reservations"


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_email_builder__get_application_ext_link(language: LanguageLiteral, settings, email_template):
    settings.EMAIL_VARAAMO_EXT_LINK = link = "https://varaamo.hel.fi"

    reservation = ReservationFactory.create()

    builder = get_email_builder(email_template, reservation, language=language)

    lang_part = f"/{language}" if language != "fi" else ""
    assert builder._get_my_applications_ext_link() == f"{link}{lang_part}/applications"


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_email_builder__get_varaamo_ext_link(language: LanguageLiteral, settings, email_template):
    settings.EMAIL_VARAAMO_EXT_LINK = link = "https://varaamo.hel.fi"

    reservation = ReservationFactory.create()

    builder = get_email_builder(email_template, reservation, language=language)

    lang_part = f"/{language}" if language != "fi" else ""
    assert builder._get_varaamo_ext_link() == f"{link}{lang_part}"


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_email_builder__get_varaamo_feedback_ext_link(language: LanguageLiteral, settings, email_template):
    settings.EMAIL_VARAAMO_EXT_LINK = link = "https://varaamo.hel.fi"
    settings.EMAIL_FEEDBACK_EXT_LINK = feedback = "https://varaamo.hel.fi/feedback"

    reservation = ReservationFactory.create()

    builder = get_email_builder(email_template, reservation, language=language)

    link_quoted = urllib.parse.quote(link, safe="")
    assert builder._get_feedback_ext_link() == f"{feedback}?site=varaamopalaute&lang={language}&ref={link_quoted}"


def test_email_builder__context_attr_map_fails_on_undefined_methods(settings, email_template):
    settings.EMAIL_TEMPLATE_CONTEXT_VARIABLES = [*settings.EMAIL_TEMPLATE_CONTEXT_VARIABLES, "not_found"]

    reservation = ReservationFactory.create()

    msg = "Email context variable not_found did not have _get method defined."
    with pytest.raises(EmailBuilderConfigError, match=msg):
        ReservationEmailNotificationBuilder(reservation, email_template)
