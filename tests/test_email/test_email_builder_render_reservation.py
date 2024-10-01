import datetime
import re
from decimal import Decimal

import freezegun
import pytest

from tests.factories import EmailTemplateFactory, ReservationFactory, ReservationUnitFactory
from tests.helpers import patch_method
from tilavarauspalvelu.enums import EmailType
from tilavarauspalvelu.exceptions import EmailTemplateValidationError
from tilavarauspalvelu.models import EmailTemplate, Reservation
from tilavarauspalvelu.utils.email.email_builder_reservation import ReservationEmailBuilder, ReservationEmailContext
from tilavarauspalvelu.utils.email.email_validator import EmailTemplateValidator

pytestmark = [
    pytest.mark.django_db,
]


@pytest.fixture
def email_template() -> EmailTemplate:
    return EmailTemplateFactory.build(
        type=EmailType.RESERVATION_CONFIRMED,
        name="Test template",
    )


@pytest.fixture
def reservation() -> Reservation:
    return ReservationFactory.create(name="Test reservation")


# Errors


def test_email_builder__raises__on_invalid_tag_in_subject(email_template, reservation):
    email_template.subject_fi = "Text content FI {{invalid_tag}}"

    context = ReservationEmailContext.from_reservation(reservation)

    msg = "Tag 'invalid_tag' is not supported"
    with pytest.raises(EmailTemplateValidationError, match=re.escape(msg)):
        ReservationEmailBuilder(template=email_template, context=context)


def test_email_builder__raises__on_illegal_tag_in_subject(email_template, reservation):
    email_template.subject = "I contain an illegal {% foo %} tag"

    context = ReservationEmailContext.from_reservation(reservation)

    msg = "Illegal tags found: tag was 'foo'"
    with pytest.raises(EmailTemplateValidationError, match=re.escape(msg)):
        ReservationEmailBuilder(template=email_template, context=context)


@pytest.mark.parametrize("language", ["fi", "en", "sv"])
@patch_method(EmailTemplateValidator.render_template)
def test_email_builder__get_subject__with_html_file(language, email_template, reservation):
    EmailTemplateValidator.render_template.return_value = f"HTML content {language}"

    reservation.reservee_language = language
    context = ReservationEmailContext.from_reservation(reservation)
    builder = ReservationEmailBuilder(template=email_template, context=context)

    assert builder.get_html_content() == f"HTML content {language}"


@freezegun.freeze_time("2021-01-01T12:00:00+02:00")
def test_email_builder__get_subject(settings, email_template):
    link = settings.EMAIL_VARAAMO_EXT_LINK
    feedback = settings.EMAIL_FEEDBACK_EXT_LINK

    reservation = ReservationFactory.create(
        name="foo",
        begin=datetime.datetime(2022, 2, 9, 10, 0),
        end=datetime.datetime(2022, 2, 9, 12, 0),
        price=Decimal("52"),
        non_subsidised_price=0,
    )

    email_template.subject = """
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

    builder = ReservationEmailBuilder.from_reservation(template=email_template, reservation=reservation)

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
        link to feedback {feedback}?lang=fi
    """

    assert builder.get_subject() == compiled_content


def test_email_builder__get_subject__variable_tag_padding(email_template, reservation):
    email_template.subject = "I have {{ reservation_number }} padding"

    builder = ReservationEmailBuilder.from_reservation(template=email_template, reservation=reservation)

    assert builder.get_subject() == f"I have {reservation.id} padding"


def test_email_builder__get_subject__variable_tag_no_padding(email_template, reservation):
    email_template.subject = "I don't have {{reservation_number}} padding"

    builder = ReservationEmailBuilder.from_reservation(template=email_template, reservation=reservation)

    assert builder.get_subject() == f"I don't have {reservation.id} padding"


def test_email_builder__get_subject__if_else_elif_expressions_supported(email_template, reservation):
    email_template.subject = """
        {% if True %}This is if{% endif %}
        {% if False %}No show{% elif True %}This is elif{% endif %}
        {% if False %}No show{% else %}This is else{% endif %}
    """
    compiled_content = """
        This is if
        This is elif
        This is else
    """

    builder = ReservationEmailBuilder.from_reservation(template=email_template, reservation=reservation)

    assert builder.get_subject() == compiled_content


def test_email_builder__get_subject__for_loop_not_supported(email_template, reservation):
    email_template.subject = """
        {% for i in range(0, 100) %}
        loopey looper
        {% endfor %}

        {% macro secret_macro() %}
        ninja sabotage
        {% endmacro %}
    """

    msg = "Illegal tags found: tag was 'for'"
    with pytest.raises(EmailTemplateValidationError, match=re.escape(msg)):
        ReservationEmailBuilder.from_reservation(template=email_template, reservation=reservation)


def test_email_builder__get_subject__currency_filter_comma_separator(email_template, reservation):
    reservation.price = 52
    email_template.subject = "{{price | currency}}"
    compiled_content = "52,00"

    builder = ReservationEmailBuilder.from_reservation(template=email_template, reservation=reservation)

    assert builder.get_subject() == compiled_content


def test_email_builder__get_subject__currency_filter_thousand_separator_is_space(email_template, reservation):
    reservation.price = 10000
    email_template.subject = "{{price | currency}}"
    compiled_content = "10 000,00"

    builder = ReservationEmailBuilder.from_reservation(template=email_template, reservation=reservation)

    assert builder.get_subject() == compiled_content


def test_email_builder__subsidised_price(email_template, reservation):
    reservation.price = 52
    reservation.tax_percentage_value = 10
    email_template.subject = (
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

    builder = ReservationEmailBuilder.from_reservation(template=email_template, reservation=reservation)

    assert builder.get_subject() == compiled_content


def test_email_builder__get_subject__subsidised_price_from_price_calc(email_template, reservation):
    reservation.price = 52
    reservation.tax_percentage_value = Decimal("25.5")
    reservation.applying_for_free_of_charge = True
    email_template.subject = (
        "{% if price > 0 %}{% if subsidised_price < price %}"
        "Varauksen hinta: {{subsidised_price | currency}}"
        " - {{price | currency}} € (sis. alv {{tax_percentage}}%){% else %}"
        "Varauksen hinta: {{price | currency}} € (sis. alv {{tax_percentage}}%)"
        "{% endif %}"
        "{% else %}"
        "Varauksen hinta: 0 €"
        "{% endif %}"
    )
    compiled_content = "Varauksen hinta: 0,00 - 52,00 € (sis. alv 25.5%)"

    builder = ReservationEmailBuilder.from_reservation(template=email_template, reservation=reservation)

    assert builder.get_subject() == compiled_content


def test_email_builder__get_subject__confirmed_instructions_renders(email_template):
    reservation_unit = ReservationUnitFactory.create(reservation_confirmed_instructions="foo")
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    email_template.subject = """
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

    builder = ReservationEmailBuilder.from_reservation(template=email_template, reservation=reservation)

    assert builder.get_subject() == compiled_content


def test_email_builder__get_subject__pending_instructions_renders(email_template):
    reservation_unit = ReservationUnitFactory.create(reservation_pending_instructions="foo")
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    email_template.subject = """
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

    builder = ReservationEmailBuilder.from_reservation(template=email_template, reservation=reservation)

    assert builder.get_subject() == compiled_content


def test_email_builder__get_subject__cancel_instructions_renders(email_template):
    reservation_unit = ReservationUnitFactory.create(reservation_cancelled_instructions="foo")
    reservation = ReservationFactory.create(reservation_unit=[reservation_unit])

    email_template.subject = """
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

    builder = ReservationEmailBuilder.from_reservation(template=email_template, reservation=reservation)

    assert builder.get_subject() == compiled_content
