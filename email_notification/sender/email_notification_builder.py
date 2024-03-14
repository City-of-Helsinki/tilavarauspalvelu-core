import datetime
from decimal import Decimal
from typing import Any
from urllib.parse import urlencode, urljoin

from django.conf import settings
from django.utils.timezone import get_default_timezone

from email_notification.exceptions import EmailBuilderConfigError, EmailNotificationBuilderError
from email_notification.models import EmailTemplate
from email_notification.sender.email_notification_context import EmailNotificationContext
from email_notification.sender.email_notification_validator import EmailTemplateValidator
from reservations.models import Reservation
from tilavarauspalvelu.utils.commons import LANGUAGES


class ReservationEmailNotificationBuilder:
    validator: EmailTemplateValidator
    template: EmailTemplate
    context: EmailNotificationContext
    reservation: Reservation | None

    def __init__(
        self,
        reservation: Reservation | None,
        template: EmailTemplate,
        language: str | None = None,
        context: EmailNotificationContext | None = None,
    ):
        if reservation and context:
            raise EmailNotificationBuilderError(
                "Reservation and context cannot be used at the same time. Provide only one of them."
            )
        self.reservation = reservation
        self.template = template
        self.context = context or EmailNotificationContext.from_reservation(reservation)
        self._set_language(language or self.context.reservee_language)
        self._init_context_attr_map()
        self.validator = EmailTemplateValidator()
        self.validate_template()

    def _get_reservee_name(self) -> str:
        return self.context.reservee_name

    def _get_begin_date(self) -> str:
        return self.context.begin_datetime.strftime("%-d.%-m.%Y")

    def _get_begin_time(self) -> str:
        return self.context.begin_datetime.strftime("%H:%M")

    def _get_end_date(self) -> str:
        return self.context.end_datetime.strftime("%-d.%-m.%Y")

    def _get_end_time(self) -> str:
        return self.context.end_datetime.strftime("%H:%M")

    def _get_reservation_number(self) -> int:
        return self.context.reservation_number

    def _get_unit_location(self) -> str:
        return self.context.unit_location

    def _get_unit_name(self) -> str:
        return self.context.unit_name

    def _get_name(self) -> str:
        return self.context.reservation_name

    def _get_reservation_unit(self) -> str:
        return self.context.reservation_unit_name

    def _get_price(self) -> Decimal:
        return self.context.price

    def _get_non_subsidised_price(self) -> Decimal:
        return self.context.non_subsidised_price

    def _get_subsidised_price(self) -> Decimal:
        return self.context.subsidised_price

    def _get_tax_percentage(self) -> int:
        return self.context.tax_percentage

    def _get_confirmed_instructions(self) -> str:
        return self.context.confirmed_instructions[self.language]

    @staticmethod
    def _get_current_year() -> int:
        return datetime.datetime.now(get_default_timezone()).year

    def _get_pending_instructions(self) -> str:
        return self.context.pending_instructions[self.language]

    def _get_cancelled_instructions(self) -> str:
        return self.context.cancelled_instructions[self.language]

    def _get_reservation_unit_instruction_field(self, name: str) -> str:
        if self.reservation is None:
            return ""

        instructions = []
        for res_unit in self.reservation.reservation_unit.all():
            instructions.append(self._get_by_language(res_unit, name))

        return "\n-\n".join(instructions)

    def _get_deny_reason(self) -> str:
        return self.context.deny_reason[self.language]

    def _get_cancel_reason(self) -> str:
        return self.context.cancel_reason[self.language]

    def _get_varaamo_ext_link(self) -> str:
        url_base = settings.EMAIL_VARAAMO_EXT_LINK

        if self.language.lower() != "fi":
            return urljoin(url_base, self.language)

        return url_base

    def _get_my_reservations_ext_link(self) -> str:
        url_base = settings.EMAIL_VARAAMO_EXT_LINK

        if self.language.lower() != "fi":
            url_base = urljoin(url_base, self.language) + "/"

        return urljoin(url_base, "reservations")

    def _get_my_applications_ext_link(self) -> str:
        url_base = settings.EMAIL_VARAAMO_EXT_LINK

        if self.language.lower() != "fi":
            url_base = urljoin(url_base, self.language) + "/"

        return urljoin(url_base, "applications")

    def _get_feedback_ext_link(self) -> str:
        params = urlencode(
            {
                "site": "varaamopalaute",
                "lang": self.language,
                "ref": settings.EMAIL_VARAAMO_EXT_LINK,
            }
        )

        return f"{settings.EMAIL_FEEDBACK_EXT_LINK}?{params}"

    def _get_by_language(self, instance: Any, field: str) -> str:
        return getattr(instance, f"{field}_{self.language}", getattr(instance, field, ""))

    def _get_html_content(self, instance) -> str:
        html_template_file = self._get_by_language(instance, "html_content")
        if not html_template_file:
            return ""

        return html_template_file.open().read().decode("utf-8")

    def _set_language(self, lang: str) -> None:
        """If the template has content for the given language, use it. Otherwise, use Finnish."""
        if getattr(self.template, f"content_{lang}", None):
            self.language = lang
        else:
            self.language = LANGUAGES.FI

    def _init_context_attr_map(self) -> None:
        self.context_attr_map = {}
        for key in settings.EMAIL_TEMPLATE_CONTEXT_VARIABLES:
            value = getattr(self, f"_get_{key}", None)
            if value is None:
                raise EmailBuilderConfigError("Email context variable %s did not have _get method defined." % key)
            self.context_attr_map[key] = value()

    def validate_template(self) -> None:
        html_content = self._get_html_content(self.template)
        if html_content:
            self.validator.validate_string(html_content, self.context_attr_map)

        self.validator.validate_string(self.template.subject, self.context_attr_map)
        self.validator.validate_string(self.template.content, self.context_attr_map)

    def get_subject(self) -> str:
        subject = self._get_by_language(self.template, "subject")
        return self.validator.render_string(string=subject, context=self.context_attr_map)

    def get_content(self) -> str:
        content = self._get_by_language(self.template, "content")
        return self.validator.render_string(string=content, context=self.context_attr_map)

    def get_html_content(self) -> str | None:
        content = self._get_html_content(self.template)
        if not content:
            return None
        return self.validator.render_string(string=content, context=self.context_attr_map)
