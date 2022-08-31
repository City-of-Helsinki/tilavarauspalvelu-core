import re

from django.conf import settings
from django.template import Context, Template

from applications.models import CUSTOMER_TYPES
from email_notification.models import EmailTemplate
from reservations.models import Reservation


class EmailTemplateValidator:
    @property
    def bracket_lookup(self):
        return re.compile(r"{{ *(\w+) *}}")

    @property
    def illegal_lookup(self):
        return re.compile(r"{%|%}")

    def _validate_tags(self, str: str):
        tags = re.findall(self.bracket_lookup, str)
        for tag in tags:
            if tag not in settings.EMAIL_TEMPLATE_CONTEXT_ATTRS:
                raise EmailTemplateValidationError(f"Tag {tag} not supported")

    def _validate_illegals(self, str: str):
        illegals = re.findall(self.illegal_lookup, str)
        if illegals:
            raise EmailTemplateValidationError("Illegal tags found")

    def validate_string(self, str: str):
        self._validate_illegals(str)
        self._validate_tags(str)
        return True


class ReservationEmailNotificationBuilder:
    validator = EmailTemplateValidator

    def __init__(self, reservation: Reservation, template: EmailTemplate):
        self.reservation = reservation
        self.template = template
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
        return self.reservation.begin.strftime("%d.%m.%Y")

    def _get_begin_time(self):
        return self.reservation.begin.strftime("%H:%M")

    def _get_end_date(self):
        return self.reservation.end.strftime("%d.%m.%Y")

    def _get_end_time(self):
        return self.reservation.end.strftime("%H:%M")

    def _get_reservation_number(self):
        return str(self.reservation.pk).zfill(10)

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
        validator.validate_string(self.template.subject)
        validator.validate_string(self.template.content)

    def get_context(self):
        context_dict = {}
        for key, value in self.context_attr_map.items():
            if callable(value):
                context_dict[key] = value()
                continue

            context_dict[key] = getattr(self.reservation, value, None)

        return Context(context_dict)

    def get_subject(self):
        rendered = Template(template_string=self.template.subject).render(
            context=self.get_context()
        )
        return rendered

    def get_content(self):
        rendered = Template(template_string=self.template.content).render(
            context=self.get_context()
        )
        return rendered


class EmailTemplateValidationError(Exception):
    def __init__(self, *args, **kwargs):
        if len(args) > 0:
            self.message = args[0]


class EmailBuilderConfigError(Exception):
    pass
