import datetime
from decimal import Decimal

from assertpy import assert_that
from django.conf import settings
from django.test import override_settings
from pytz import UTC

from applications.models import CUSTOMER_TYPES
from email_notification.models import EmailTemplate, EmailType
from email_notification.sender.email_notification_builder import (
    EmailBuilderConfigError,
    EmailTemplateValidationError,
    ReservationEmailNotificationBuilder,
)
from email_notification.tests.base import ReservationEmailBaseTestCase
from email_notification.tests.factories import EmailTemplateFactory
from reservation_units.tests.factories import ReservationUnitFactory
from tilavarauspalvelu.utils.commons import LANGUAGES


class ReservationEmailNotificationBuilderTestCase(ReservationEmailBaseTestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.builder = ReservationEmailNotificationBuilder(
            cls.reservation, cls.email_template
        )

    def test_get_reservee_name(self):
        reservee_name_str = f"{self.reservation.reservee_first_name} {self.reservation.reservee_last_name}"
        assert_that(self.builder._get_reservee_name()).is_equal_to(reservee_name_str)

    def test_get_reservee_name_when_reservee_type_business(self):
        self.reservation.reservee_type = CUSTOMER_TYPES.CUSTOMER_TYPE_BUSINESS
        self.reservation.save()
        reservee_name_str = self.reservation.reservee_organisation_name
        assert_that(self.builder._get_reservee_name()).is_equal_to(reservee_name_str)

    def test_get_reservee_name_when_reservee_type_nonprofit(self):
        self.reservation.reservee_type = CUSTOMER_TYPES.CUSTOMER_TYPE_NONPROFIT
        self.reservation.save()
        reservee_name_str = self.reservation.reservee_organisation_name
        assert_that(self.builder._get_reservee_name()).is_equal_to(reservee_name_str)

    def test_get_begin_time(self):
        assert_that(self.builder._get_begin_time()).is_equal_to("10:00")

    def test_get_begin_time_respects_timezone(self):
        self.reservation.begin = datetime.datetime(2022, 2, 28, 23, 00, tzinfo=UTC)
        self.reservation.save()

        assert_that(self.builder._get_begin_time()).is_equal_to("01:00")

    def test_get_begin_date(self):
        assert_that(self.builder._get_begin_date()).is_equal_to("9.2.2022")

    def test_get_begin_date_respects_timezone(self):
        self.reservation.begin = datetime.datetime(2022, 2, 28, 23, 00, tzinfo=UTC)
        self.reservation.save()

        assert_that(self.builder._get_begin_date()).is_equal_to("1.3.2022")

    def test_get_end_time(self):
        assert_that(self.builder._get_end_time()).is_equal_to("12:00")

    def test_get_end_time_respects_timezone(self):
        self.reservation.end = datetime.datetime(2022, 3, 1, 1, 00, tzinfo=UTC)
        self.reservation.save()

        assert_that(self.builder._get_end_time()).is_equal_to("03:00")

    def test_get_end_date(self):
        assert_that(self.builder._get_end_date()).is_equal_to("9.2.2022")

    def test_get_end_date_respects_timezone(self):
        self.reservation.end = datetime.datetime(2022, 2, 28, 23, 00, tzinfo=UTC)
        self.reservation.save()

        assert_that(self.builder._get_end_date()).is_equal_to("1.3.2022")

    def test_get_reservation_number(self):
        resno = self.reservation.id
        assert_that(self.builder._get_reservation_number()).is_equal_to(resno)

    def test_get_unit_location(self):
        location_str = f"{self.location.address_street} {self.location.address_zip} {self.location.address_city}"
        assert_that(self.builder._get_unit_location()).is_equal_to(location_str)

    def test_get_unit_name(self):
        assert_that(self.builder._get_unit_name()).is_equal_to(self.unit.name)

    def test_get_reservation_unit_when_single(self):
        assert_that(self.builder._get_reservation_unit()).is_equal_to(
            self.reservation_unit.name
        )

    def test_get_reservation_unit_when_multiple(self):
        res_unit_one = self.reservation_unit.name
        res_unit = ReservationUnitFactory(
            unit=self.unit,
        )
        res_unit_too = res_unit.name

        self.reservation.reservation_unit.add(res_unit)
        assert_that(self.builder._get_reservation_unit()).is_equal_to(
            f"{res_unit_one}, {res_unit_too}"
        )

    def test_get_price(self):
        assert_that(self.builder._get_price()).is_equal_to(self.reservation.price)

    def test_get_non_subsidised_price(self):
        assert_that(self.builder._get_non_subsidised_price()).is_equal_to(
            self.reservation.non_subsidised_price
        )

    def test_get_tax_percentage(self):
        assert_that(self.builder._get_tax_percentage()).is_equal_to(
            self.reservation.tax_percentage_value
        )

    def test_get_confirmed_instructions(self):
        assert_that(self.builder._get_confirmed_instructions()).contains(
            self.reservation.reservation_unit.first().reservation_confirmed_instructions
        )

    def test_get_confirmed_instructions_en(self):
        self.builder._set_language(LANGUAGES.EN)
        assert_that(self.builder._get_confirmed_instructions()).contains(
            self.reservation.reservation_unit.first().reservation_confirmed_instructions_en
        )

    def test_get_pending_instructions(self):
        assert_that(self.builder._get_pending_instructions()).contains(
            self.reservation.reservation_unit.first().reservation_pending_instructions
        )

    def test_get_pending_instructions_en(self):
        self.builder._set_language(LANGUAGES.EN)
        assert_that(self.builder._get_pending_instructions()).contains(
            self.reservation.reservation_unit.first().reservation_pending_instructions_en
        )

    def test_get_cancelled_instructions(self):
        assert_that(self.builder._get_cancelled_instructions()).contains(
            self.reservation.reservation_unit.first().reservation_cancelled_instructions
        )

    def test_get_cancelled_instructions_en(self):
        self.builder._set_language(LANGUAGES.EN)
        assert_that(self.builder._get_cancelled_instructions()).contains(
            self.reservation.reservation_unit.first().reservation_cancelled_instructions_en
        )

    def test_get_deny_reason(self):
        assert_that(self.builder._get_deny_reason()).is_equal_to(
            self.reservation.deny_reason.reason
        )

    def test_get_deny_reason_en(self):
        self.builder._set_language(LANGUAGES.EN)
        assert_that(self.builder._get_deny_reason()).is_equal_to(
            self.reservation.deny_reason.reason_en
        )

    def test_get_cancel_reason(self):
        assert_that(self.builder._get_cancel_reason()).is_equal_to(
            self.reservation.cancel_reason.reason
        )

    def test_get_cancel_reason_en(self):
        self.builder._set_language(LANGUAGES.EN)
        assert_that(self.builder._get_cancel_reason()).is_equal_to(
            self.reservation.cancel_reason.reason_en
        )

    @override_settings(
        EMAIL_TEMPLATE_CONTEXT_VARIABLES=settings.EMAIL_TEMPLATE_CONTEXT_VARIABLES
        + ["imnotdefined"]
    )
    def test_context_attr_map_fails_on_undefined_methods(self):
        with self.assertRaises(EmailBuilderConfigError):
            ReservationEmailNotificationBuilder(self.reservation, self.email_template)

    def test_validate_fails_on_init_when_unsupported_tag(self):
        template = EmailTemplateFactory(
            content="I'm containing unsupported {{ taggie }} tag",
            subject="test",
            type=EmailType.RESERVATION_HANDLED_AND_CONFIRMED,
        )
        with self.assertRaises(EmailTemplateValidationError):
            ReservationEmailNotificationBuilder(self.reservation, template)

    def test_validate_fails_on_init_when_illegal_tag(self):
        template = EmailTemplateFactory(
            content="I'm containing illegal {% nastiness %} tag",
            subject="test",
            type=EmailType.HANDLING_REQUIRED_RESERVATION,
        )
        with self.assertRaises(EmailTemplateValidationError):
            ReservationEmailNotificationBuilder(self.reservation, template)

    def test_get_subject(self):
        subject = "Hello {{ reservee_name }}"
        compiled_subject = "Hello Let it Snow"

        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_CANCELLED, subject=subject, content="content"
        )
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert_that(builder.get_subject()).is_equal_to(compiled_subject)

    def test_get_content(self):
        content = """
            Should contain {{ name }} and {{ begin_date }} and {{ begin_time }} and {{ end_date }}
            and {{ end_time }} and of course the {{ reservation_number }}

            {% if price %}Price is {{ price | currency }} €
            and subsidised price was {{ non_subsidised_price | currency }} €{% endif %}

            Yours truly:
            system.
        """
        compiled_content = f"""
            Should contain Dance time! and 9.2.2022 and 10:00 and 9.2.2022
            and 12:00 and of course the {self.reservation.id}

            Price is 52,00 €
            and subsidised price was 0,00 €

            Yours truly:
            system.
        """
        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject"
        )
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert_that(builder.get_content()).is_equal_to(compiled_content)

    def test_padding_does_not_matter_in_curly_brackets(self):
        EmailTemplate.objects.all().delete()
        content_with_space_inside_braces = "I have {{ reservation_number }} padding"
        compiled_content_with_space_inside_braces = (
            f"I have {self.reservation.id} padding"
        )
        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_MODIFIED,
            content=content_with_space_inside_braces,
            subject="subject",
        )
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        actual_compiled_content_with_space_in_brackets = builder.get_content()
        assert_that(actual_compiled_content_with_space_in_brackets).is_equal_to(
            compiled_content_with_space_inside_braces
        )

        content_without_space_in_brackets = "I have {{reservation_number}} padding"
        compiled_content_without_space_in_brackets = (
            f"I have {self.reservation.id} padding"
        )
        template.content = content_without_space_in_brackets
        template.save()
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        actual_compiled_content_without_space_in_brackets = builder.get_content()
        assert_that(actual_compiled_content_without_space_in_brackets).is_equal_to(
            compiled_content_without_space_in_brackets
        )

        # Assert actually does not matter
        assert_that(actual_compiled_content_without_space_in_brackets).is_equal_to(
            actual_compiled_content_with_space_in_brackets
        )

    def test_language_defaults_to_fi_when_content_not_translated(self):
        self.builder._set_language(LANGUAGES.SV)
        assert_that(self.builder.language).is_equal_to(LANGUAGES.FI)
        assert_that(self.builder._get_deny_reason()).is_equal_to(
            self.reservation.deny_reason.reason_fi
        )

    def test_confirmed_instructions_renders(self):
        content = """
            This is the email message next one up we have confirmed_instructions.
            {{ confirmed_instructions }}

            Yours truly:
            system.
        """
        compiled_content = f"""
            This is the email message next one up we have confirmed_instructions.
            {self.reservation_unit.reservation_confirmed_instructions}

            Yours truly:
            system.
        """
        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject"
        )
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert_that(builder.get_content()).is_equal_to(compiled_content)

    def test_pending_instructions_renders(self):
        content = """
            This is the email message next one up we have confirmed_instructions.
            {{ pending_instructions }}

            Yours truly:
            system.
        """
        compiled_content = f"""
            This is the email message next one up we have confirmed_instructions.
            {self.reservation_unit.reservation_pending_instructions}

            Yours truly:
            system.
        """
        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject"
        )
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert_that(builder.get_content()).is_equal_to(compiled_content)

    def test_cancel_instructions_renders(self):
        content = """
            This is the email message next one up we have confirmed_instructions.
            {{ cancelled_instructions }}

            Yours truly:
            system.
        """
        compiled_content = f"""
            This is the email message next one up we have confirmed_instructions.
            {self.reservation_unit.reservation_cancelled_instructions}

            Yours truly:
            system.
        """
        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject"
        )
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert_that(builder.get_content()).is_equal_to(compiled_content)

    def test_if_else_elif_expressions_supported(self):
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
        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject"
        )
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert_that(builder.get_content()).is_equal_to(compiled_content)

    def test_for_loop_not_supported(self):
        content = """
                    {% for i in range(0, 100) %}
                    loopey looper
                    {% endfor %}

                    {% macro secret_macro() %}
                    ninja sabotage
                    {% endmacro %}
                """
        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject"
        )
        with self.assertRaises(EmailTemplateValidationError):
            ReservationEmailNotificationBuilder(self.reservation, template)

    def test_macros_not_supported(self):
        content = """
                    {% for i in range(0, 100) %}
                    loopey looper
                    {% endfor %}

                    {% macro secret_macro() %}
                    ninja sabotage
                    {% endmacro %}
                """
        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject"
        )
        with self.assertRaises(EmailTemplateValidationError):
            ReservationEmailNotificationBuilder(self.reservation, template)

    def test_currency_filter_comma_separator(self):
        content = "{{price | currency}}"
        compiled_content = "52,00"

        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject"
        )
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert_that(builder.get_content()).is_equal_to(compiled_content)

    def test_currency_filter_thousand_separator_is_space(self):
        self.reservation.price = Decimal("10000")
        self.reservation.save()
        content = "{{price | currency}}"
        compiled_content = "10 000,00"

        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject"
        )
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert_that(builder.get_content()).is_equal_to(compiled_content)

    def test_subsidised_price(self):
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

        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject"
        )
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert_that(builder.get_content()).is_equal_to(compiled_content)

    def test_subsidised_price_from_price_calc(self):
        self.reservation.applying_for_free_of_charge = True
        self.reservation.save()
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

        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject"
        )
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert_that(builder.get_content()).is_equal_to(compiled_content)
