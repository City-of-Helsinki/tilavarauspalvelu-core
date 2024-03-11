import datetime
import re
import urllib.parse
from typing import Literal

import freezegun
import pytest
from django.utils.timezone import get_default_timezone

from email_notification.models import EmailTemplate, EmailType
from email_notification.sender.email_notification_builder import (
    EmailBuilderConfigError,
    EmailTemplateValidationError,
    ReservationEmailNotificationBuilder,
)
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


def get_email_template():
    return EmailTemplateFactory.create(
        type=EmailType.RESERVATION_CONFIRMED,
        content="This is the {{ reservation_number }} content",
        content_en="This is the {{ reservation_number }} content in english",
        content_sv="This is the {{ reservation_number }} content in swedish",
        subject="This is the subject {{ name }}",
        subject_en="This is the subject {{ name }} in english",
        subject_sv="This is the subject {{ name }} in english",
    )


def get_email_builder(
    email_template: EmailTemplate,
    reservation: Reservation,
    *,
    language: Literal["fi", "en", "sv"] | None = None,
) -> ReservationEmailNotificationBuilder:
    builder = ReservationEmailNotificationBuilder(reservation, email_template)
    if language is not None:
        builder._set_language(language)
    return builder


def test_get_reservee_name__reservee_type_individual():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        reservee_type=CustomerTypeChoice.INDIVIDUAL,
    )

    builder = get_email_builder(email_template, reservation)

    reservee_name_str = f"{reservation.reservee_first_name} {reservation.reservee_last_name}"
    assert builder._get_reservee_name() == reservee_name_str


def test_get_reservee_name__reservee_type_business():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        reservee_type=CustomerTypeChoice.BUSINESS,
    )

    builder = get_email_builder(email_template, reservation)

    reservee_name_str = reservation.reservee_organisation_name
    assert builder._get_reservee_name() == reservee_name_str


def test_get_reservee_name__reservee_type_nonprofit():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        reservee_type=CustomerTypeChoice.NONPROFIT,
    )

    builder = get_email_builder(email_template, reservation)

    reservee_name_str = reservation.reservee_organisation_name
    assert builder._get_reservee_name() == reservee_name_str


def test_get_begin_time():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        begin=datetime.datetime(2021, 1, 1, 12, 0),
    )

    builder = get_email_builder(email_template, reservation)

    assert builder._get_begin_time() == "12:00"


def test_get_begin_time__timezone():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        begin=datetime.datetime(2021, 1, 1, 12, 0, tzinfo=datetime.UTC),
    )

    builder = get_email_builder(email_template, reservation)

    assert builder._get_begin_time() == "14:00"


def test_get_begin_date():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        begin=datetime.datetime(2021, 1, 1, 12, 0),
    )

    builder = get_email_builder(email_template, reservation)

    assert builder._get_begin_date() == "1.1.2021"


def test_get_begin_date__timezone():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        begin=datetime.datetime(2021, 1, 1, 23, 0, tzinfo=datetime.UTC),
    )

    builder = get_email_builder(email_template, reservation)

    assert builder._get_begin_date() == "2.1.2021"


def test_get_end_time():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        end=datetime.datetime(2021, 1, 1, 12, 0),
    )

    builder = get_email_builder(email_template, reservation)

    assert builder._get_end_time() == "12:00"


def test_get_end_time__timezone():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        end=datetime.datetime(2021, 1, 1, 12, 0, tzinfo=datetime.UTC),
    )

    builder = get_email_builder(email_template, reservation)

    assert builder._get_end_time() == "14:00"


def test_get_end_date():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        end=datetime.datetime(2021, 1, 1, 12, 0),
    )

    builder = get_email_builder(email_template, reservation)

    assert builder._get_end_date() == "1.1.2021"


def test_get_end_date__timezone():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        end=datetime.datetime(2021, 1, 1, 23, 0, tzinfo=datetime.UTC),
    )

    builder = get_email_builder(email_template, reservation)

    assert builder._get_end_date() == "2.1.2021"


def test_get_reservation_number():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation)

    assert builder._get_reservation_number() == reservation.id


def test_get_unit_location():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    location = LocationFactory.create(unit=reservation_unit.unit)
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation)

    location_str = f"{location.address_street}, {location.address_zip} {location.address_city}"
    assert builder._get_unit_location() == location_str


def test_get_unit_name():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation)

    assert builder._get_unit_name() == reservation_unit.unit.name


def test_get_reservation_unit__single():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation)

    assert builder._get_reservation_unit() == reservation_unit.name


def test_get_reservation_unit__multiple():
    email_template = get_email_template()
    reservation_unit_1 = ReservationUnitFactory.create()
    reservation_unit_2 = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit_1, reservation_unit_2])

    builder = get_email_builder(email_template, reservation)

    assert builder._get_reservation_unit() == f"{reservation_unit_1.name}, {reservation_unit_2.name}"


def test_get_price():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation)

    assert builder._get_price() == reservation.price


def test_get_non_subsidised_price():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation)

    assert builder._get_non_subsidised_price() == reservation.non_subsidised_price


def test_get_tax_percentage():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation)

    assert builder._get_tax_percentage() == reservation.tax_percentage_value


@freezegun.freeze_time("2021-01-01T12:00:00+02:00")
def test_get_current_year():
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation)

    assert builder._get_current_year() == datetime.datetime.now(tz=get_default_timezone()).year


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_get_confirmed_instructions__fi(language: Literal["fi", "en", "sv"]):
    email_template = get_email_template()
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
def test_get_pending_instructions(language: Literal["fi", "en", "sv"]):
    email_template = get_email_template()
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
def test_get_cancelled_instructions(language: Literal["fi", "en", "sv"]):
    email_template = get_email_template()
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
def test_get_deny_reason(language: Literal["fi", "en", "sv"]):
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    deny_reason = ReservationDenyReasonFactory.create(
        reason_fi="foo",
        reason_en="bar",
        reason_sv="baz",
    )
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        deny_reason=deny_reason,
    )

    builder = get_email_builder(email_template, reservation, language=language)

    assert builder._get_deny_reason() == getattr(deny_reason, f"reason_{language}")


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_get_cancel_reason(language: Literal["fi", "en", "sv"]):
    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    cancel_reason = ReservationCancelReasonFactory.create(
        reason_fi="foo",
        reason_en="bar",
        reason_sv="baz",
    )
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        cancel_reason=cancel_reason,
    )

    builder = get_email_builder(email_template, reservation, language=language)

    assert builder._get_cancel_reason() == getattr(cancel_reason, f"reason_{language}")


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_get_reservations_ext_link(language: Literal["fi", "en", "sv"], settings):
    settings.EMAIL_VARAAMO_EXT_LINK = link = "https://varaamo.hel.fi"

    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation, language=language)

    lang_part = f"/{language}" if language != "fi" else ""
    assert builder._get_my_reservations_ext_link() == f"{link}{lang_part}/reservations"


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_get_application_ext_link(language: Literal["fi", "en", "sv"], settings):
    settings.EMAIL_VARAAMO_EXT_LINK = link = "https://varaamo.hel.fi"

    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation, language=language)

    lang_part = f"/{language}" if language != "fi" else ""
    assert builder._get_my_applications_ext_link() == f"{link}{lang_part}/applications"


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_get_varaamo_ext_link(language: Literal["fi", "en", "sv"], settings):
    settings.EMAIL_VARAAMO_EXT_LINK = link = "https://varaamo.hel.fi"

    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation, language=language)

    lang_part = f"/{language}" if language != "fi" else ""
    assert builder._get_varaamo_ext_link() == f"{link}{lang_part}"


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
def test_get_varaamo_feedback_ext_link(language: Literal["fi", "en", "sv"], settings):
    settings.EMAIL_VARAAMO_EXT_LINK = link = "https://varaamo.hel.fi"
    settings.EMAIL_FEEDBACK_EXT_LINK = feedback = "https://varaamo.hel.fi/feedback"

    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation, language=language)

    link_quoted = urllib.parse.quote(link, safe="")
    assert builder._get_feedback_ext_link() == f"{feedback}?site=varaamopalaute&lang={language}&ref={link_quoted}"


def test_context_attr_map_fails_on_undefined_methods(settings):
    settings.EMAIL_TEMPLATE_CONTEXT_VARIABLES = [*settings.EMAIL_TEMPLATE_CONTEXT_VARIABLES, "not_found"]

    email_template = get_email_template()
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    msg = "Email context variable not_found did not have _get method defined."
    with pytest.raises(EmailBuilderConfigError, match=re.escape(msg)):
        get_email_builder(email_template, reservation)


def test_validate_fails_on_init_when_unsupported_tag():
    email_template = EmailTemplateFactory.create(
        content="I contain an unsupported {{ foo }} tag",
        subject="test",
        type=EmailType.RESERVATION_HANDLED_AND_CONFIRMED,
    )
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    msg = "Tag foo not supported"
    with pytest.raises(EmailTemplateValidationError, match=re.escape(msg)):
        ReservationEmailNotificationBuilder(reservation, email_template)


def test_validate_fails_on_init_when_illegal_tag():
    email_template = EmailTemplateFactory(
        content="I contain an illegal {% foo %} tag",
        subject="test",
        type=EmailType.HANDLING_REQUIRED_RESERVATION,
    )
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    msg = "Encountered unknown tag 'foo'."
    with pytest.raises(EmailTemplateValidationError, match=re.escape(msg)):
        ReservationEmailNotificationBuilder(reservation, email_template)


def test_get_subject():
    email_template = EmailTemplateFactory(
        type=EmailType.RESERVATION_CANCELLED,
        subject="Hello {{ reservee_name }}",
        content="content",
    )
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation)

    assert builder.get_subject() == f"Hello {reservation.reservee_first_name} {reservation.reservee_last_name}"


@freezegun.freeze_time("2021-01-01T12:00:00+02:00")
def test_get_content(settings):
    settings.EMAIL_VARAAMO_EXT_LINK = link = "https://varaamo.hel.fi"
    settings.EMAIL_FEEDBACK_EXT_LINK = feedback = "https://varaamo.hel.fi/feedback"

    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        name="foo",
        reservation_unit=[reservation_unit],
        begin=datetime.datetime(2022, 2, 9, 10, 0),
        end=datetime.datetime(2022, 2, 9, 12, 0),
        price=52,
        non_subsidised_price=0,
    )

    content = """
        Should contain {{ name }} and {{ begin_date }} and {{ begin_time }} and {{ end_date }}
        and {{ end_time }} and of course the {{ reservation_number }}

        {% if price %}Price is {{ price | currency }} €
        and subsidised price was {{ non_subsidised_price | currency }} €{% endif %}

        Yours truly:
        system.

        copyright {{ current_year }}
        link to varaamo {{ varaamo_ext_link }}
        link to reservations {{ my_reservations_ext_link }}
        link to feedback {{ feedback_ext_link }}
    """

    template = EmailTemplateFactory(
        type=EmailType.RESERVATION_MODIFIED,
        content=content,
        subject="subject",
    )

    builder = ReservationEmailNotificationBuilder(reservation, template)

    compiled_content = f"""
        Should contain foo and 9.2.2022 and 10:00 and 9.2.2022
        and 12:00 and of course the {reservation.id}

        Price is 52,00 €
        and subsidised price was 0,00 €

        Yours truly:
        system.

        copyright 2021
        link to varaamo {link}
        link to reservations {link}/reservations
        link to feedback {feedback}?site=varaamopalaute&lang=fi&ref={urllib.parse.quote(link, safe='')}
    """

    assert builder.get_content() == compiled_content


def test_padding_in_templates():
    email_template = EmailTemplateFactory(
        type=EmailType.RESERVATION_MODIFIED,
        content="I have {{ reservation_number }} padding",
        subject="subject",
    )
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    builder = get_email_builder(email_template, reservation)

    assert builder.get_content() == f"I have {reservation.id} padding"

    email_template.content = "I don't have {{reservation_number}} padding"
    email_template.save()

    builder = get_email_builder(email_template, reservation)

    assert builder.get_content() == f"I don't have {reservation.id} padding"


def test_confirmed_instructions_renders():
    reservation_unit = ReservationUnitFactory.create(reservation_confirmed_instructions="foo")
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    content = """
        This is the email message next one up we have confirmed_instructions.
        {{ confirmed_instructions }}

        Yours truly:
        system.
    """
    compiled_content = f"""
        This is the email message next one up we have confirmed_instructions.
        {reservation_unit.reservation_confirmed_instructions}

        Yours truly:
        system.
    """

    template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
    builder = ReservationEmailNotificationBuilder(reservation, template)

    assert builder.get_content() == compiled_content


def test_pending_instructions_renders():
    reservation_unit = ReservationUnitFactory.create(reservation_pending_instructions="foo")
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    content = """
        This is the email message next one up we have pending_instructions.
        {{ pending_instructions }}

        Yours truly:
        system.
    """
    compiled_content = f"""
        This is the email message next one up we have pending_instructions.
        {reservation_unit.reservation_pending_instructions}

        Yours truly:
        system.
    """

    template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
    builder = ReservationEmailNotificationBuilder(reservation, template)

    assert builder.get_content() == compiled_content


def test_cancel_instructions_renders():
    reservation_unit = ReservationUnitFactory.create(reservation_cancelled_instructions="foo")
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    content = """
        This is the email message next one up we have cancelled_instructions.
        {{ cancelled_instructions }}

        Yours truly:
        system.
    """
    compiled_content = f"""
        This is the email message next one up we have cancelled_instructions.
        {reservation_unit.reservation_cancelled_instructions}

        Yours truly:
        system.
    """

    template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
    builder = ReservationEmailNotificationBuilder(reservation, template)

    assert builder.get_content() == compiled_content


def test_if_else_elif_expressions_supported():
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    content = """
        {% if True %}This is if{% endif %}

        {% if False %}No show{% elif True %}This is elif{% endif %}

        {% if False %}No show{% else %}This is else{% endif %}
    """
    compiled_content = """
        This is if

        This is elif

        This is else
    """

    template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
    builder = ReservationEmailNotificationBuilder(reservation, template)

    assert builder.get_content() == compiled_content


def test_for_loop_not_supported():
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    content = """
        {% for i in range(0, 100) %}
        loopey looper
        {% endfor %}

        {% macro secret_macro() %}
        ninja sabotage
        {% endmacro %}
    """

    template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")

    msg = "Illegal tags found: tag was 'for'"
    with pytest.raises(EmailTemplateValidationError, match=re.escape(msg)):
        ReservationEmailNotificationBuilder(reservation, template)


def test_currency_filter_comma_separator():
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit], price=52)

    content = "{{price | currency}}"
    compiled_content = "52,00"

    template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
    builder = ReservationEmailNotificationBuilder(reservation, template)

    assert builder.get_content() == compiled_content


def test_currency_filter_thousand_separator_is_space():
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit], price=10000)

    content = "{{price | currency}}"
    compiled_content = "10 000,00"

    template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
    builder = ReservationEmailNotificationBuilder(reservation, template)

    assert builder.get_content() == compiled_content


def test_subsidised_price():
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit], price=52, tax_percentage_value=10)

    content = (
        "{% if price > 0 %}{% if subsidised_price < price %}"
        "Varauksen hinta: {{subsidised_price | currency}}"
        "- {{price | currency}} € (sis. alv {{tax_percentage}}%){% else %}"
        "Varauksen hinta: {{price | currency}} € (sis. alv {{tax_percentage}}%)"
        "{% endif %}"
        "{% else %}"
        "Varauksen hinta: 0 €"
        "{% endif %}"
    )
    compiled_content = "Varauksen hinta: 52,00 € (sis. alv 10%)"

    template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
    builder = ReservationEmailNotificationBuilder(reservation, template)

    assert builder.get_content() == compiled_content


def test_subsidised_price_from_price_calc():
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        price=52,
        tax_percentage_value=10,
        applying_for_free_of_charge=True,
    )

    content = (
        "{% if price > 0 %}{% if subsidised_price < price %}"
        "Varauksen hinta: {{subsidised_price | currency}}"
        " - {{price | currency}} € (sis. alv {{tax_percentage}}%){% else %}"
        "Varauksen hinta: {{price | currency}} € (sis. alv {{tax_percentage}}%)"
        "{% endif %}"
        "{% else %}"
        "Varauksen hinta: 0 €"
        "{% endif %}"
    )
    compiled_content = "Varauksen hinta: 0,00 - 52,00 € (sis. alv 10%)"

    template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
    builder = ReservationEmailNotificationBuilder(reservation, template)

    assert builder.get_content() == compiled_content
