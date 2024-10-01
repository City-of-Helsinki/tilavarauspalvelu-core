from admin_extra_buttons.decorators import button
from admin_extra_buttons.mixins import ExtraButtonsMixin
from django.contrib import admin
from django.core.exceptions import ValidationError
from django.core.handlers.wsgi import WSGIRequest
from django.forms import ModelForm
from django.http import HttpResponseRedirect
from django.template.response import TemplateResponse
from modeltranslation.admin import TranslationAdmin

from tilavarauspalvelu.admin.email_template.tester import email_template_tester_admin_view
from tilavarauspalvelu.enums import EmailType
from tilavarauspalvelu.exceptions import EmailTemplateValidationError
from tilavarauspalvelu.models import EmailTemplate
from tilavarauspalvelu.utils.email.email_builder_application import ApplicationEmailBuilder, ApplicationEmailContext
from tilavarauspalvelu.utils.email.email_builder_reservation import ReservationEmailBuilder, ReservationEmailContext
from tilavarauspalvelu.utils.email.email_validator import EmailTemplateValidator


class EmailTemplateAdminForm(ModelForm):
    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self._init_email_type_choices()

    def _init_email_type_choices(self):
        """
        Set up the available 'type' choices
        Remove existing types from the choices, so that the same type cannot be added twice
        """
        existing_types = EmailTemplate.objects.values_list("type", flat=True)
        if self.instance and self.instance.type:
            existing_types = existing_types.exclude(type=self.instance.type)
        available_types = [(value, label) for value, label in EmailType.choices if value not in existing_types]
        self.fields["type"].choices = available_types

    def _get_validator(self) -> EmailTemplateValidator:
        email_template_type = self.cleaned_data["type"]

        # Reservation
        if email_template_type in ReservationEmailBuilder.email_template_types:
            return EmailTemplateValidator(context=ReservationEmailContext.from_mock_data())

        # Application
        if email_template_type in ApplicationEmailBuilder.email_template_types:
            return EmailTemplateValidator(context=ApplicationEmailContext.from_mock_data())

        raise EmailTemplateValidationError(f"Email template type '{email_template_type}' is not supported.")

    def _get_validated_field(self, field) -> str | None:
        data: str | None = self.cleaned_data[field]
        if not data:
            return data

        try:
            self._get_validator().validate_string(data)
        except EmailTemplateValidationError as err:
            raise ValidationError(err.message) from err
        return data

    def clean_subject_fi(self) -> str | None:
        return self._get_validated_field("subject_fi")

    def clean_subject_en(self) -> str | None:
        return self._get_validated_field("subject_en")

    def clean_subject_sv(self) -> str | None:
        return self._get_validated_field("subject_sv")


@admin.register(EmailTemplate)
class EmailTemplateAdmin(ExtraButtonsMixin, TranslationAdmin):
    form = EmailTemplateAdminForm

    list_display = [
        "type",
        "name",
    ]

    @button(label="Email Template Testing", change_form=True)
    def template_tester(self, request: WSGIRequest, pk: int) -> TemplateResponse | HttpResponseRedirect:
        return email_template_tester_admin_view(self, request, pk)
