import datetime
import os
import re
from decimal import Decimal
from typing import Any
from urllib.parse import urlencode, urljoin

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.utils.timezone import get_default_timezone
from jinja2 import TemplateError
from jinja2.sandbox import SandboxedEnvironment

from email_notification.exceptions import (
    EmailBuilderConfigError,
    EmailNotificationBuilderError,
    EmailTemplateValidationError,
)
from email_notification.models import EmailTemplate
from email_notification.sender.email_notification_context import EmailNotificationContext
from email_notification.templatetags.email_template_filters import format_currency
from reservations.models import Reservation
from tilavarauspalvelu.utils.commons import LANGUAGES

FILTERS_MAP = {"currency": format_currency}


def get_sandboxed_environment() -> SandboxedEnvironment:
    env = SandboxedEnvironment()

    for fil, func in FILTERS_MAP.items():
        env.filters[fil] = func

    return env


class EmailTemplateValidator:
    @staticmethod
    def _validate_tags(string: str) -> None:
        # Matches "{{ word }}" or "{{ word1 | word2 }}".
        # Note, this doesn't match the preferred format with spaces around the pipe: "{{word1|word2}}"
        bracket_lookup = re.compile(r"{{ *(\w+) \| *(\w+) *}}|{{ *(\w+) *}}")

        tags_inside_brackets = re.findall(bracket_lookup, string)
        variable_tags = []

        for strings in tags_inside_brackets:
            strings_list = [tag for tag in strings if tag and tag not in FILTERS_MAP]

            variable_tags.append(strings_list[0])

        for tag in variable_tags:
            if tag not in settings.EMAIL_TEMPLATE_CONTEXT_VARIABLES:
                raise EmailTemplateValidationError(f"Tag {tag} not supported")

    @staticmethod
    def _validate_illegals(string: str) -> None:
        # Matches "{% word %}".
        expression_lookup = re.compile(r"{% *(\w+) *")

        expressions = re.findall(expression_lookup, string)
        for expression in expressions:
            if expression not in settings.EMAIL_TEMPLATE_SUPPORTED_EXPRESSIONS:
                raise EmailTemplateValidationError("Illegal tags found: tag was '%s'" % expression)

    @staticmethod
    def _validate_in_sandbox(string: str, context: dict, env: SandboxedEnvironment) -> None:
        try:
            env.from_string(string).render(context)
        except TemplateError as e:
            raise EmailTemplateValidationError(e)

    def validate_string(self, string: str, context_dict: dict = (), env: SandboxedEnvironment = None):
        env = env or get_sandboxed_environment()
        self._validate_in_sandbox(string, context_dict, env)
        self._validate_illegals(string)
        self._validate_tags(string)

    def validate_html_file(self, value: InMemoryUploadedFile, context_dict=()) -> None:
        # File extension
        file_extension = os.path.splitext(value.name)[1]
        if file_extension.lower() != ".html":
            raise ValidationError(f"Unsupported file extension {file_extension}. Only .html files are allowed")

        # File size
        if value.size <= 0 or value.size > settings.EMAIL_HTML_MAX_FILE_SIZE:
            raise ValidationError(
                f"Invalid HTML file size. Allowed file size: 1-{settings.EMAIL_HTML_MAX_FILE_SIZE} bytes"
            )

        # File content
        try:
            file = value.open()
            content = file.read().decode("utf-8")
            self.validate_string(content, context_dict)
        except EmailTemplateValidationError as err:
            raise ValidationError(err.message)
        except Exception as err:
            raise ValidationError(f"Unable to read the HTML file: {err!s}")


class ReservationEmailNotificationBuilder:
    validator = EmailTemplateValidator
    template: EmailTemplate
    context: EmailNotificationContext
    reservation: Reservation | None

    def __init__(
        self,
        reservation: Reservation,
        template: EmailTemplate,
        language=None,
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
        self.env = get_sandboxed_environment()
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
        validator = self.validator()

        html_content = self._get_html_content(self.template)
        if html_content:
            validator.validate_string(html_content, self.context_attr_map, env=self.env)

        validator.validate_string(self.template.subject, self.context_attr_map, env=self.env)
        validator.validate_string(self.template.content, self.context_attr_map, env=self.env)

    def get_subject(self) -> str:
        subject = self._get_by_language(self.template, "subject")
        rendered = self.env.from_string(subject).render(self.context_attr_map)
        return rendered

    def get_content(self) -> str:
        content = self._get_by_language(self.template, "content")
        return self.env.from_string(content).render(self.context_attr_map)

    def get_html_content(self) -> str | None:
        content = self._get_html_content(self.template)
        if content:
            return self.env.from_string(content).render(self.context_attr_map)
        return None
