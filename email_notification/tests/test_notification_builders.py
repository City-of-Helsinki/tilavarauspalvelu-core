import datetime

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
        assert_that(self.builder._get_begin_date()).is_equal_to("09.02.2022")

    def test_get_begin_date_respects_timezone(self):
        self.reservation.begin = datetime.datetime(2022, 2, 28, 23, 00, tzinfo=UTC)
        self.reservation.save()

        assert_that(self.builder._get_begin_date()).is_equal_to("01.03.2022")

    def test_get_end_time(self):
        assert_that(self.builder._get_end_time()).is_equal_to("12:00")

    def test_get_end_time_respects_timezone(self):
        self.reservation.end = datetime.datetime(2022, 3, 1, 1, 00, tzinfo=UTC)
        self.reservation.save()

        assert_that(self.builder._get_end_time()).is_equal_to("03:00")

    def test_get_end_date(self):
        assert_that(self.builder._get_end_date()).is_equal_to("09.02.2022")

    def test_get_end_date_respects_timezone(self):
        self.reservation.end = datetime.datetime(2022, 2, 28, 23, 00, tzinfo=UTC)
        self.reservation.save()

        assert_that(self.builder._get_end_date()).is_equal_to("01.03.2022")

    def test_get_reservation_number(self):
        resno = str(self.reservation.id).zfill(10)
        assert_that(self.builder._get_reservation_number()).is_equal_to(f"{resno}")

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
        EMAIL_TEMPLATE_CONTEXT_ATTRS=settings.EMAIL_TEMPLATE_CONTEXT_ATTRS
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
            Yours truly:
            system.
        """
        compiled_content = f"""
            Should contain Dance time! and 09.02.2022 and 10:00 and 09.02.2022
            and 12:00 and of course the {str(self.reservation.id).zfill(10)}
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
        content_with_padding = "I have {{ reservation_number }} padding"
        compiled_content_with_padding = (
            f"I have {str(self.reservation.id).zfill(10)} padding"
        )
        template = EmailTemplateFactory(
            type=EmailType.RESERVATION_MODIFIED,
            content=content_with_padding,
            subject="subject",
        )
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        actual_compiled_content_with_padding = builder.get_content()
        assert_that(actual_compiled_content_with_padding).is_equal_to(
            compiled_content_with_padding
        )

        content_without_padding = "I have {{reservation_number}} padding"
        compiled_content_without_padding = (
            f"I have {str(self.reservation.id).zfill(10)} padding"
        )
        template.content = content_without_padding
        template.save()
        builder = ReservationEmailNotificationBuilder(self.reservation, template)
        actual_compiled_content_without_padding = builder.get_content()
        assert_that(actual_compiled_content_without_padding).is_equal_to(
            compiled_content_without_padding
        )

        # Assert actually does not matter
        assert_that(actual_compiled_content_without_padding).is_equal_to(
            actual_compiled_content_with_padding
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
