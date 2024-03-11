import contextlib
from typing import Any

from admin_extra_buttons.api import ExtraButtonsMixin, button
from django.contrib import admin
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.forms import ModelForm, ValidationError
from django.http import HttpResponseRedirect
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from email_notification.email_tester import EmailTestForm, ReservationUnitSelectForm
from email_notification.models import EmailTemplate, EmailType
from email_notification.sender.email_notification_builder import (
    EmailNotificationContext,
    EmailTemplateValidationError,
    EmailTemplateValidator,
)
from email_notification.sender.senders import send_test_emails
from reservation_units.models import ReservationUnit
from spaces.models import Location


def _get_template_tester_form_initial_values(request) -> dict[str, Any]:
    recipient = request.user.email if request.user else ""
    initial_values = {"recipient": recipient}

    with contextlib.suppress(AttributeError):
        # Select the template that user navigated from
        initial_values["template"] = request.resolver_match.kwargs.get("extra_context")

    reservation_unit_pk = request.GET.get("reservation_unit", None)
    if not reservation_unit_pk:
        return initial_values

    reservation_unit: ReservationUnit = ReservationUnit.objects.filter(pk=int(reservation_unit_pk)).first()
    if not reservation_unit:
        return initial_values

    initial_values["reservation_unit_name"] = reservation_unit.name
    initial_values["unit_name"] = getattr(reservation_unit.unit, "name", "")

    location: Location | None = getattr(reservation_unit.unit, "location", None)
    if location is not None:
        initial_values["unit_location"] = str(location)

    for lang in ["fi", "sv", "en"]:
        for field in ["confirmed_instructions", "pending_instructions", "cancelled_instructions"]:
            initial_values[f"{field}_{lang}"] = getattr(reservation_unit, f"reservation_{field}_{lang}", "")

    return initial_values


class EmailTemplateAdminForm(ModelForm):
    required_fields = ["content_fi", "subject_fi"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        existing_types = EmailTemplate.objects.values_list("type", flat=True)
        if self.instance and self.instance.type:
            existing_types = existing_types.exclude(type=self.instance.type)

        available_types = [(value, label) for value, label in EmailType.choices if value not in existing_types]
        self.fields["type"].choices = list(available_types)
        self.test_context = EmailNotificationContext.with_mock_data().__dict__

    def get_validated_field(self, field):
        data = self.cleaned_data[field]

        if data is None:
            if field in self.required_fields:
                raise ValidationError(f"Field {field} is required.")
        else:
            try:
                EmailTemplateValidator().validate_string(data, context_dict=self.test_context)
            except EmailTemplateValidationError as e:
                raise ValidationError(e.message) from e

        return data

    def validate_uploaded_html_file(self, language: str):
        file = self.cleaned_data[f"html_content_{language}"]

        if file and isinstance(file, InMemoryUploadedFile):
            EmailTemplateValidator().validate_html_file(file, context_dict=self.test_context)

        return file

    def clean_subject(self):
        subject = self.get_validated_field("subject")
        return subject

    def clean_subject_en(self):
        subject = self.get_validated_field("subject_en")
        return subject

    def clean_subject_sv(self):
        subject = self.get_validated_field("subject_sv")
        return subject

    def clean_content(self):
        content = self.get_validated_field("content")
        return content

    def clean_content_en(self):
        content = self.get_validated_field("content_en")
        return content

    def clean_content_sv(self):
        content = self.get_validated_field("content_sv")
        return content

    def clean_html_content_fi(self):
        file = self.validate_uploaded_html_file("fi")
        return file

    def clean_html_content_en(self):
        file = self.validate_uploaded_html_file("en")
        return file

    def clean_html_content_sv(self):
        file = self.validate_uploaded_html_file("sv")
        return file


@admin.register(EmailTemplate)
class EmailTemplateAdmin(ExtraButtonsMixin, admin.ModelAdmin):
    model = EmailTemplate
    form = EmailTemplateAdminForm
    exclude = ["html_content"]

    @button(label="Email Template Testing")
    def template_tester(self, request, extra_context=None) -> TemplateResponse | HttpResponseRedirect:
        if request.method == "POST":
            form = EmailTestForm(request.POST)
            if form.is_valid():
                template = EmailTemplate.objects.filter(pk=request.POST["template"]).first()
                send_test_emails(template, form)
                self.message_user(request, _("Test Email '%s' successfully sent.") % template.name)

                template_admin_url = reverse("admin:email_notification_emailtemplate_change", args=[template.id])
                return redirect(f"{template_admin_url}template_tester/")
        else:
            initial_values = _get_template_tester_form_initial_values(request)
            form = EmailTestForm(initial=initial_values)

        context = self.admin_site.each_context(request)
        context["opts"] = self.model._meta
        context["form"] = form
        context["runit_form"] = ReservationUnitSelectForm()

        return TemplateResponse(request, "email_tester.html", context=context)
