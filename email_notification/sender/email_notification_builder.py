import os
import re

from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.template import Context, Template
from django.utils.timezone import get_default_timezone
from jinja2 import TemplateError
from jinja2.sandbox import SandboxedEnvironment

from applications.models import CUSTOMER_TYPES
from email_notification.models import EmailTemplate
from reservations.models import Reservation
from tilavarauspalvelu.utils.commons import LANGUAGES


def get_sandboxed_environment():
    env = SandboxedEnvironment()
    return env


class EmailTemplateValidator:
    @property
    def bracket_lookup(self):
        return re.compile(r"{{ *(\w+) *}}")

    @property
    def expression_lookup(self):
        return re.compile(r"{% *(\w+) *")

    def _validate_tags(self, str: str):
        tags = re.findall(self.bracket_lookup, str)
        for tag in tags:
            if tag not in settings.EMAIL_TEMPLATE_CONTEXT_ATTRS:
                raise EmailTemplateValidationError(f"Tag {tag} not supported")

    def _validate_illegals(self, str: str):
        expressions = re.findall(self.expression_lookup, str)
        for expression in expressions:
            if expression not in settings.EMAIL_TEMPLATE_SUPPORTED_EXPRESSIONS:
                raise EmailTemplateValidationError(
                    "Illegal tags found: tag was '%s'" % expression
                )

    def _validate_in_sandbox(self, str: str, context):
        env = get_sandboxed_environment()
        try:
            env.from_string(str).render(context)
        except TemplateError as e:
            raise EmailTemplateValidationError(e)

    def validate_string(self, str: str, context_dict=()):
        self._validate_in_sandbox(str, context_dict)
        self._validate_illegals(str)
        self._validate_tags(str)

        return True

    def validate_html_file(self, value: InMemoryUploadedFile, context_dict=()):
        ext = os.path.splitext(value.name)[1]
        if not ext.lower() == ".html":
            raise ValidationError(
                f"Unsupported file extension {ext}. Only .html files are allowed"
            )

        if value.size <= 0 or value.size > settings.EMAIL_HTML_MAX_FILE_SIZE:
            raise ValidationError(
                f"Invalid HTML file size. Allowed file size: 1-{settings.EMAIL_HTML_MAX_FILE_SIZE} bytes"
            )

        try:
            file = value.open()
            content = file.read().decode("utf-8")
            self.validate_string(content, context_dict)
        except EmailTemplateValidationError as err:
            raise ValidationError(err.message)
        except Exception as err:
            raise ValidationError(f"Unable to read the HTML file: {str(err)}")


class ReservationEmailNotificationBuilder:
    validator = EmailTemplateValidator

    def __init__(
        self, reservation: Reservation, template: EmailTemplate, language=None
    ):
        self.reservation = reservation
        self.template = template
        self._set_language(language or reservation.reservee_language)
        self._init_context_attr_map()
        self.validate_template()

    def _get_reservee_name(self):
        if (
            not self.reservation.reservee_type
            or self.reservation.reservee_type == CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL
        ):
            return f"{self.reservation.reservee_first_name} {self.reservation.reservee_last_name}"
        return self.reservation.reservee_organisation_name

    def _get_begin_date(self):
        return self.reservation.begin.astimezone(get_default_timezone()).strftime(
            "%-d.%-m.%Y"
        )

    def _get_begin_time(self):
        return self.reservation.begin.astimezone(get_default_timezone()).strftime(
            "%H:%M"
        )

    def _get_end_date(self):
        return self.reservation.end.astimezone(get_default_timezone()).strftime(
            "%-d.%-m.%Y"
        )

    def _get_end_time(self):
        return self.reservation.end.astimezone(get_default_timezone()).strftime("%H:%M")

    def _get_reservation_number(self):
        return self.reservation.id

    def _get_unit_location(self):
        res_unit = self.reservation.reservation_unit.filter(unit__isnull=False).first()
        location = getattr(res_unit.unit, "location", None)
        if not location:
            return None

        return (
            f"{location.address_street} {location.address_zip} {location.address_city}"
        )

    def _get_unit_name(self):
        res_unit = self.reservation.reservation_unit.filter(unit__isnull=False).first()
        if not res_unit:
            return None

        return res_unit.unit.name

    def _get_name(self):
        return self.reservation.name

    def _get_reservation_unit(self):
        if self.reservation.reservation_unit.count() > 1:
            reservation_unit_names = ", ".join(
                self.reservation.reservation_unit.values_list("name", flat=True)
            )
        else:
            reservation_unit_names = self.reservation.reservation_unit.first().name

        return reservation_unit_names

    def _get_price(self):
        return self.reservation.price

    def _get_tax_percentage(self):
        return self.reservation.tax_percentage_value

    def _get_confirmed_instructions(self):
        return self._get_reservation_unit_instruction_field(
            "reservation_confirmed_instructions"
        )

    def _get_pending_instructions(self):
        return self._get_reservation_unit_instruction_field(
            "reservation_pending_instructions"
        )

    def _get_cancelled_instructions(self):
        return self._get_reservation_unit_instruction_field(
            "reservation_cancelled_instructions"
        )

    def _get_reservation_unit_instruction_field(self, name):
        instructions = []
        for res_unit in self.reservation.reservation_unit.all():
            instructions.append(self._get_by_language(res_unit, name))

        return "\n-\n".join(instructions)

    def _get_deny_reason(self):
        return self._get_by_language(self.reservation.deny_reason, "reason")

    def _get_cancel_reason(self):
        return self._get_by_language(self.reservation.cancel_reason, "reason")

    def _get_by_language(self, instance, field):
        return getattr(
            instance, f"{field}_{self.language}", getattr(instance, field, "")
        )

    def _get_html_content(self, instance):
        html_template_file = self._get_by_language(instance, "html_content")
        if not html_template_file:
            return ""

        return html_template_file.open().read().decode("utf-8")

    def _set_language(self, lang):
        if getattr(self.template, f"content_{lang}", None):
            self.language = lang
        else:
            self.language = LANGUAGES.FI

    def _init_context_attr_map(self):
        self.context_attr_map = {}
        for key in settings.EMAIL_TEMPLATE_CONTEXT_ATTRS:
            value = getattr(self, f"_get_{key}", False)
            if not value:
                raise EmailBuilderConfigError(
                    "Email context variable %s did not had _get method defined." % key
                )
            self.context_attr_map[key] = value

    def validate_template(self):
        validator = self.validator()
        validator.validate_string(self.template.subject, self.context_attr_map)
        validator.validate_string(self.template.content, self.context_attr_map)

        html_content = self._get_html_content(self.template)
        if html_content:
            validator.validate_string(html_content)

    def get_context(self):
        context_dict = {}
        for key, value in self.context_attr_map.items():
            if callable(value):
                context_dict[key] = value()
                continue

            context_dict[key] = getattr(self.reservation, value, None)

        return Context(context_dict)

    def get_subject(self):
        subject = self._get_by_language(self.template, "subject")
        rendered = Template(template_string=subject).render(context=self.get_context())
        return rendered

    def get_content(self):
        html_content = self._get_html_content(self.template)
        content = (
            html_content
            if html_content
            else self._get_by_language(self.template, "content")
        )
        rendered = Template(template_string=content).render(context=self.get_context())
        return rendered


class EmailTemplateValidationError(Exception):
    def __init__(self, *args, **kwargs):
        if len(args) > 0:
            self.message = args[0]


class EmailBuilderConfigError(Exception):
    pass
