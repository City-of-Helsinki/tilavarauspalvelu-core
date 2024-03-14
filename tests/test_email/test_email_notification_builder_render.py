import datetime
import urllib.parse

import freezegun
import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from email_notification.exceptions import EmailNotificationBuilderError, EmailTemplateValidationError
from email_notification.models import EmailTemplate
from email_notification.sender.email_notification_builder import (
    EmailNotificationContext,
    ReservationEmailNotificationBuilder,
)
from reservations.models import Reservation
from tests.factories import EmailTemplateFactory, ReservationFactory, ReservationUnitFactory

pytestmark = [
    pytest.mark.django_db,
]

mock_data = EmailNotificationContext.with_mock_data()


@pytest.fixture()
def email_template() -> EmailTemplate:
    html_file_fi = SimpleUploadedFile(name="mock_file_fi.html", content=b"HTML content FI")
    html_file_en = SimpleUploadedFile(name="mock_file_en.html", content=b"HTML content EN")
    html_file_sv = SimpleUploadedFile(name="mock_file_sv.html", content=b"HTML content SV")

    return EmailTemplateFactory.build(
        name="Test template",
        content_fi="Text content FI",
        content_en="Text content EN",
        content_sv="Text content SV",
        html_content_fi=html_file_fi,
        html_content_en=html_file_en,
        html_content_sv=html_file_sv,
    )


@pytest.fixture()
def reservation() -> Reservation:
    return ReservationFactory.create(name="Test reservation")


# Errors


def test_email_builder__raises__on_invalid_tag_in_text_content(email_template, reservation):
    email_template.content_fi = "Text content FI {{invalid_tag}}"

    msg = "Tag 'invalid_tag' is not supported"
    with pytest.raises(EmailTemplateValidationError, match=msg):
        ReservationEmailNotificationBuilder(reservation=reservation, template=email_template, language="fi")


def test_email_builder__raises__on_invalid_tag_in_html_content(email_template, reservation):
    email_template.html_content_fi = SimpleUploadedFile(name="mock_file_fi.html", content=b"HTML FI {{invalid_tag}}")

    msg = "Tag 'invalid_tag' is not supported"
    with pytest.raises(EmailTemplateValidationError, match=msg):
        ReservationEmailNotificationBuilder(reservation=reservation, template=email_template, language="fi")


def test_email_builder__raises__on_illegal_tag_in_text_content(email_template, reservation):
    email_template.content = "I contain an illegal {% foo %} tag"

    msg = "Illegal tags found: tag was 'foo'"
    with pytest.raises(EmailTemplateValidationError, match=msg):
        ReservationEmailNotificationBuilder(reservation, email_template)


def test_email_builder__raises__when_both_reservation_and_context_are_given(email_template, reservation):
    context = EmailNotificationContext.from_reservation(reservation)
    msg = "Reservation and context cannot be used at the same time. Provide only one of them."
    with pytest.raises(EmailNotificationBuilderError, match=msg):
        ReservationEmailNotificationBuilder(
            reservation=reservation, template=email_template, language="fi", context=context
        )


# Get Subject


def test_email_builder__get_subject(email_template, reservation):
    email_template.subject = "Hello {{ reservee_name }}"

    builder = ReservationEmailNotificationBuilder(reservation, email_template)

    assert builder.get_subject() == f"Hello {reservation.reservee_first_name} {reservation.reservee_last_name}"


# Get HTML Content


def test_email_builder__get_content__with_html_file(email_template, reservation):
    builder_fi = ReservationEmailNotificationBuilder(reservation, email_template, "fi")
    builder_en = ReservationEmailNotificationBuilder(reservation, email_template, "en")
    builder_sv = ReservationEmailNotificationBuilder(reservation, email_template, "sv")

    assert builder_fi.get_html_content() == "HTML content FI"
    assert builder_en.get_html_content() == "HTML content EN"
    assert builder_sv.get_html_content() == "HTML content SV"


# Get Content


def test_email_builder__get_content__with_text_content(email_template, reservation):
    builder_fi = ReservationEmailNotificationBuilder(reservation, email_template, "fi")
    builder_en = ReservationEmailNotificationBuilder(reservation, email_template, "en")
    builder_sv = ReservationEmailNotificationBuilder(reservation, email_template, "sv")

    assert builder_fi.get_content() == "Text content FI"
    assert builder_en.get_content() == "Text content EN"
    assert builder_sv.get_content() == "Text content SV"


@freezegun.freeze_time("2021-01-01T12:00:00+02:00")
def test_email_builder__get_content(settings, email_template):
    settings.EMAIL_VARAAMO_EXT_LINK = link = "https://varaamo.hel.fi"
    settings.EMAIL_FEEDBACK_EXT_LINK = feedback = "https://varaamo.hel.fi/feedback"

    reservation = ReservationFactory.create(
        name="foo",
        begin=datetime.datetime(2022, 2, 9, 10, 0),
        end=datetime.datetime(2022, 2, 9, 12, 0),
        price=52,
        non_subsidised_price=0,
    )

    email_template.content = """
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

    builder = ReservationEmailNotificationBuilder(reservation, email_template)

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


def test_email_builder__get_content__padding_in_templates(email_template, reservation):
    email_template.content = "I have {{ reservation_number }} padding"

    builder = ReservationEmailNotificationBuilder(reservation, email_template)

    assert builder.get_content() == f"I have {reservation.id} padding"

    email_template.content = "I don't have {{reservation_number}} padding"

    builder = ReservationEmailNotificationBuilder(reservation, email_template)

    assert builder.get_content() == f"I don't have {reservation.id} padding"


def test_email_builder__get_content__if_else_elif_expressions_supported(email_template, reservation):
    email_template.content = """
        {% if True %}This is if{% endif %}
        {% if False %}No show{% elif True %}This is elif{% endif %}
        {% if False %}No show{% else %}This is else{% endif %}
    """
    compiled_content = """
        This is if
        This is elif
        This is else
    """

    builder = ReservationEmailNotificationBuilder(reservation, email_template)

    assert builder.get_content() == compiled_content


def test_email_builder__get_content__for_loop_not_supported(email_template, reservation):
    email_template.content = """
        {% for i in range(0, 100) %}
        loopey looper
        {% endfor %}

        {% macro secret_macro() %}
        ninja sabotage
        {% endmacro %}
    """

    msg = "Illegal tags found: tag was 'for'"
    with pytest.raises(EmailTemplateValidationError, match=msg):
        ReservationEmailNotificationBuilder(reservation, email_template)


def test_email_builder__get_content__currency_filter_comma_separator(email_template, reservation):
    reservation.price = 52
    email_template.content = "{{price | currency}}"
    compiled_content = "52,00"

    builder = ReservationEmailNotificationBuilder(reservation, email_template)

    assert builder.get_content() == compiled_content


def test_email_builder__get_content__currency_filter_thousand_separator_is_space(email_template, reservation):
    reservation.price = 10000
    email_template.content = "{{price | currency}}"
    compiled_content = "10 000,00"

    builder = ReservationEmailNotificationBuilder(reservation, email_template)

    assert builder.get_content() == compiled_content


def test_email_builder__subsidised_price(email_template, reservation):
    reservation.price = 52
    reservation.tax_percentage_value = 10
    email_template.content = (
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

    builder = ReservationEmailNotificationBuilder(reservation, email_template)

    assert builder.get_content() == compiled_content


def test_email_builder__get_content__subsidised_price_from_price_calc(email_template, reservation):
    reservation.price = 52
    reservation.tax_percentage_value = 10
    reservation.applying_for_free_of_charge = True
    email_template.content = (
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

    builder = ReservationEmailNotificationBuilder(reservation, email_template)

    assert builder.get_content() == compiled_content


def test_email_builder__get_content__confirmed_instructions_renders(email_template):
    reservation_unit = ReservationUnitFactory.create(reservation_confirmed_instructions="foo")
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    email_template.content = """
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

    builder = ReservationEmailNotificationBuilder(reservation, email_template)

    assert builder.get_content() == compiled_content


def test_email_builder__get_content__pending_instructions_renders(email_template):
    reservation_unit = ReservationUnitFactory.create(reservation_pending_instructions="foo")
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    email_template.content = """
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

    builder = ReservationEmailNotificationBuilder(reservation, email_template)

    assert builder.get_content() == compiled_content


def test_email_builder__get_content__cancel_instructions_renders(email_template):
    reservation_unit = ReservationUnitFactory.create(reservation_cancelled_instructions="foo")
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    email_template.content = """
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

    builder = ReservationEmailNotificationBuilder(reservation, email_template)

    assert builder.get_content() == compiled_content
