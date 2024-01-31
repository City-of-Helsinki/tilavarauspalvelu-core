import datetime
from decimal import Decimal

import pytest
from django.conf import settings
from django.test import override_settings
from django.utils import timezone

from email_notification.models import EmailTemplate, EmailType
from email_notification.sender.email_notification_builder import (
    EmailBuilderConfigError,
    EmailTemplateValidationError,
    ReservationEmailNotificationBuilder,
)
from email_notification.tests.base import ReservationEmailBaseTestCase
from reservations.choices import CustomerTypeChoice
from tests.factories import EmailTemplateFactory, ReservationUnitFactory
from tilavarauspalvelu.utils.commons import Language


class ReservationEmailNotificationBuilderTestCase(ReservationEmailBaseTestCase):
    def get_builder(self, language: Language | None = None) -> ReservationEmailNotificationBuilder:
        builder = ReservationEmailNotificationBuilder(self.reservation, self.email_template)
        if language:
            builder._set_language(language)
        return builder

    def test_get_reservee_name(self):
        reservee_name_str = f"{self.reservation.reservee_first_name} {self.reservation.reservee_last_name}"
        assert self.get_builder()._get_reservee_name() == reservee_name_str

    def test_get_reservee_name_when_reservee_type_business(self):
        self.reservation.reservee_type = CustomerTypeChoice.BUSINESS
        self.reservation.save()
        reservee_name_str = self.reservation.reservee_organisation_name
        assert self.get_builder()._get_reservee_name() == reservee_name_str

    def test_get_reservee_name_when_reservee_type_nonprofit(self):
        self.reservation.reservee_type = CustomerTypeChoice.NONPROFIT
        self.reservation.save()
        reservee_name_str = self.reservation.reservee_organisation_name
        assert self.get_builder()._get_reservee_name() == reservee_name_str

    def test_get_begin_time(self):
        assert self.get_builder()._get_begin_time() == "10:00"

    def test_get_begin_time_respects_timezone(self):
        self.reservation.begin = datetime.datetime(2022, 2, 28, 23, 00, tzinfo=datetime.UTC)
        self.reservation.save()

        assert self.get_builder()._get_begin_time() == "01:00"

    def test_get_begin_date(self):
        assert self.get_builder()._get_begin_date() == "9.2.2022"

    def test_get_begin_date_respects_timezone(self):
        self.reservation.begin = datetime.datetime(2022, 2, 28, 23, 00, tzinfo=datetime.UTC)
        self.reservation.save()

        assert self.get_builder()._get_begin_date() == "1.3.2022"

    def test_get_end_time(self):
        assert self.get_builder()._get_end_time() == "12:00"

    def test_get_end_time_respects_timezone(self):
        self.reservation.end = datetime.datetime(2022, 3, 1, 1, 00, tzinfo=datetime.UTC)
        self.reservation.save()

        assert self.get_builder()._get_end_time() == "03:00"

    def test_get_end_date(self):
        assert self.get_builder()._get_end_date() == "9.2.2022"

    def test_get_end_date_respects_timezone(self):
        self.reservation.end = datetime.datetime(2022, 2, 28, 23, 00, tzinfo=datetime.UTC)
        self.reservation.save()

        assert self.get_builder()._get_end_date() == "1.3.2022"

    def test_get_reservation_number(self):
        resno = self.reservation.id
        assert self.get_builder()._get_reservation_number() == resno

    def test_get_unit_location(self):
        location_str = f"{self.location.address_street}, {self.location.address_zip} {self.location.address_city}"
        assert self.get_builder()._get_unit_location() == location_str

    def test_get_unit_name(self):
        assert self.get_builder()._get_unit_name() == self.unit.name

    def test_get_reservation_unit_when_single(self):
        assert self.get_builder()._get_reservation_unit() == self.reservation_unit.name

    def test_get_reservation_unit_when_multiple(self):
        res_unit_one = self.reservation_unit.name
        res_unit = ReservationUnitFactory(
            unit=self.unit,
        )
        res_unit_too = res_unit.name

        self.reservation.reservation_units.add(res_unit)
        assert self.get_builder()._get_reservation_unit() == f"{res_unit_one}, {res_unit_too}"

    def test_get_price(self):
        assert self.get_builder()._get_price() == self.reservation.price

    def test_get_non_subsidised_price(self):
        assert self.get_builder()._get_non_subsidised_price() == self.reservation.non_subsidised_price

    def test_get_tax_percentage(self):
        assert self.get_builder()._get_tax_percentage() == self.reservation.tax_percentage_value

    def test_get_current_year(self):
        now = datetime.datetime.now(timezone.get_default_timezone())
        assert self.get_builder()._get_current_year() == now.year

    def test_get_confirmed_instructions(self):
        assert (
            self.reservation.reservation_units.first().reservation_confirmed_instructions
            in self.get_builder()._get_confirmed_instructions()
        )

    def test_get_confirmed_instructions_en(self):
        builder = self.get_builder(Language.EN.value)
        assert (
            self.reservation.reservation_units.first().reservation_confirmed_instructions_en
            in builder._get_confirmed_instructions()
        )

    def test_get_pending_instructions(self):
        assert (
            self.reservation.reservation_units.first().reservation_pending_instructions
            in self.get_builder()._get_pending_instructions()
        )

    def test_get_pending_instructions_en(self):
        builder = self.get_builder(Language.EN.value)
        assert (
            self.reservation.reservation_units.first().reservation_pending_instructions_en
            in builder._get_pending_instructions()
        )

    def test_get_cancelled_instructions(self):
        assert (
            self.reservation.reservation_units.first().reservation_cancelled_instructions
            in self.get_builder()._get_cancelled_instructions()
        )

    def test_get_cancelled_instructions_en(self):
        builder = self.get_builder(Language.EN.value)
        assert (
            self.reservation.reservation_units.first().reservation_cancelled_instructions_en
            in builder._get_cancelled_instructions()
        )

    def test_get_deny_reason(self):
        assert self.get_builder()._get_deny_reason() == self.reservation.deny_reason.reason

    def test_get_deny_reason_en(self):
        builder = self.get_builder(Language.EN.value)
        assert builder._get_deny_reason() == self.reservation.deny_reason.reason_en

    def test_get_cancel_reason(self):
        assert self.get_builder()._get_cancel_reason() == self.reservation.cancel_reason.reason

    def test_get_cancel_reason_en(self):
        builder = self.get_builder(Language.EN.value)
        assert builder._get_cancel_reason() == self.reservation.cancel_reason.reason_en

    @override_settings(EMAIL_VARAAMO_EXT_LINK="https://thesite.com")
    def test_get_my_reservations_ext_link_fi(self):
        builder = self.get_builder(Language.EN.value)
        assert builder._get_my_reservations_ext_link() == "https://thesite.com/reservations"

    @override_settings(EMAIL_VARAAMO_EXT_LINK="https://thesite.com")
    def test_get_my_reservations_ext_link_en(self):
        builder = self.get_builder(Language.EN.value)
        assert builder._get_my_reservations_ext_link() == "https://thesite.com/en/reservations"

    @override_settings(EMAIL_VARAAMO_EXT_LINK="https://thesite.com")
    def test_get_my_reservations_ext_link_sv(self):
        builder = self.get_builder(Language.SV.value)
        assert builder._get_my_reservations_ext_link() == "https://thesite.com/sv/reservations"

    @override_settings(EMAIL_VARAAMO_EXT_LINK="https://thesite.com")
    def test_get_varaamo_ext_link(self):
        builder = self.get_builder(Language.EN.value)
        assert builder._get_varaamo_ext_link() == "https://thesite.com"

    @override_settings(EMAIL_VARAAMO_EXT_LINK="https://thesite.com")
    def test_get_varaamo_ext_link_en(self):
        builder = self.get_builder(Language.EN.value)
        assert builder._get_varaamo_ext_link() == "https://thesite.com/en"

    @override_settings(EMAIL_VARAAMO_EXT_LINK="https://thesite.com")
    def test_get_varaamo_ext_link_sv(self):
        builder = self.get_builder(Language.SV.value)
        assert builder._get_varaamo_ext_link() == "https://thesite.com/sv"

    @override_settings(EMAIL_FEEDBACK_EXT_LINK="https://feedback.com/forms/")
    def get_feedback_ext_link_fi(self):
        builder = self.get_builder(Language.EN.value)
        assert (
            builder._get_feedback_ext_link()
            == "https://feedback.com/forms/?site=varaamopalaute&lang=fi&ref=https://tilavaraus.hel.fi"
        )

    @override_settings(EMAIL_FEEDBACK_EXT_LINK="https://feedback.com/forms/")
    def get_feedback_ext_link_sv(self):
        builder = self.get_builder(Language.SV.value)
        assert (
            builder._get_feedback_ext_link()
            == "https://feedback.com/forms/?site=varaamopalaute&lang=sv&ref=https://tilavaraus.hel.fi"
        )

    @override_settings(EMAIL_FEEDBACK_EXT_LINK="https://feedback.com/forms/")
    def get_feedback_ext_link_en(self):
        self.builder._set_language(Language.EN.value)
        assert (
            self.builder._get_feedback_ext_link()
            == "https://feedback.com/forms/?site=varaamopalaute&lang=en&ref=https://tilavaraus.hel.fi"
        )

    @override_settings(EMAIL_TEMPLATE_CONTEXT_VARIABLES=settings.EMAIL_TEMPLATE_CONTEXT_VARIABLES + ["imnotdefined"])
    def test_context_attr_map_fails_on_undefined_methods(self):
        with pytest.raises(EmailBuilderConfigError):
            ReservationEmailNotificationBuilder(self.reservation, self.email_template)

    def test_validate_fails_on_init_when_unsupported_tag(self):
        template = EmailTemplateFactory(
            content="I'm containing unsupported {{ taggie }} tag",
            subject="test",
            type=EmailType.RESERVATION_HANDLED_AND_CONFIRMED,
        )
        with pytest.raises(EmailTemplateValidationError):
            ReservationEmailNotificationBuilder(self.reservation, template)

    def test_validate_fails_on_init_when_illegal_tag(self):
        template = EmailTemplateFactory(
            content="I'm containing illegal {% nastiness %} tag",
            subject="test",
            type=EmailType.HANDLING_REQUIRED_RESERVATION,
        )
        with pytest.raises(EmailTemplateValidationError):
            ReservationEmailNotificationBuilder(self.reservation, template)

    def test_get_subject(self):
        subject = "Hello {{ reservee_name }}"
        compiled_subject = "Hello Let it Snow"

        template = EmailTemplateFactory(type=EmailType.RESERVATION_CANCELLED, subject=subject, content="content")
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert builder.get_subject() == compiled_subject

    @override_settings(
        EMAIL_FEEDBACK_EXT_LINK="https://feedtheback.com/survey/",
        EMAIL_VARAAMO_EXT_LINK="https://resourcebooking.com",
    )
    def test_get_content(self):
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
        year = datetime.datetime.now(timezone.get_default_timezone()).year
        feedback_url = (
            "https://feedtheback.com/survey/?site=varaamopalaute&lang=fi&ref=https%3A%2F%2Fresourcebooking.com"
        )
        compiled_content = f"""
            Should contain Dance time! and 9.2.2022 and 10:00 and 9.2.2022
            and 12:00 and of course the {self.reservation.id}

            Price is 52,00 €
            and subsidised price was 0,00 €

            Yours truly:
            system.

            copyright {year}
            link to varaamo https://resourcebooking.com
            link to reservations https://resourcebooking.com/reservations
            link to feedback {feedback_url}
        """
        template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert builder.get_content() == compiled_content

    def test_padding_does_not_matter_in_curly_brackets(self):
        EmailTemplate.objects.all().delete()
        content_with_space_inside_braces = "I have {{ reservation_number }} padding"
        compiled_content_with_space_inside_braces = f"I have {self.reservation.id} padding"
        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_MODIFIED,
            content=content_with_space_inside_braces,
            subject="subject",
        )
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        actual_compiled_content_with_space_in_brackets = builder.get_content()
        assert actual_compiled_content_with_space_in_brackets == compiled_content_with_space_inside_braces

        content_without_space_in_brackets = "I have {{reservation_number}} padding"
        compiled_content_without_space_in_brackets = f"I have {self.reservation.id} padding"
        template.content = content_without_space_in_brackets
        template.save()
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        actual_compiled_content_without_space_in_brackets = builder.get_content()
        assert actual_compiled_content_without_space_in_brackets == compiled_content_without_space_in_brackets

        # Assert actually does not matter
        assert actual_compiled_content_without_space_in_brackets == actual_compiled_content_with_space_in_brackets

    def test_language_defaults_to_fi_when_content_not_translated(self):
        builder = self.get_builder()
        builder.template.content_sv = None
        builder._set_language(Language.SV.value)
        assert builder.language == Language.EN.value
        assert builder._get_deny_reason() == self.reservation.deny_reason.reason_fi

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
        template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert builder.get_content() == compiled_content

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
        template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert builder.get_content() == compiled_content

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
        template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert builder.get_content() == compiled_content

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
        template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert builder.get_content() == compiled_content

    def test_for_loop_not_supported(self):
        content = """
                    {% for i in range(0, 100) %}
                    loopey looper
                    {% endfor %}

                    {% macro secret_macro() %}
                    ninja sabotage
                    {% endmacro %}
                """
        template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
        with pytest.raises(EmailTemplateValidationError):
            ReservationEmailNotificationBuilder(self.reservation, template)

    def test_currency_filter_comma_separator(self):
        content = "{{price | currency}}"
        compiled_content = "52,00"

        template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert builder.get_content() == compiled_content

    def test_currency_filter_thousand_separator_is_space(self):
        self.reservation.price = Decimal("10000")
        self.reservation.save()
        content = "{{price | currency}}"
        compiled_content = "10 000,00"

        template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert builder.get_content() == compiled_content

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

        template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert builder.get_content() == compiled_content

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

        template = EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content=content, subject="subject")
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        assert builder.get_content() == compiled_content
