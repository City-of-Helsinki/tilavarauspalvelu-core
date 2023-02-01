from typing import Any, Dict

from admin_extra_buttons.api import ExtraButtonsMixin, button
from django.contrib import admin
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.forms import ModelForm, ValidationError
from django.shortcuts import redirect
from django.template.response import TemplateResponse

from email_notification.email_tester import EmailTestForm, ReservationUnitSelectForm
from email_notification.models import EmailTemplate, EmailType
from email_notification.sender.email_notification_builder import (
    EmailNotificationContext,
    EmailTemplateValidationError,
    EmailTemplateValidator,
)
from email_notification.sender.senders import send_test_emails
from reservation_units.models import ReservationUnit


def get_initial_values(request) -> Dict[str, Any]:
    recipient = request.user.email if request.user else ""
    initial_values = {"recipient": recipient}

    reservation_unit_pk = request.GET.get("reservation_unit", None)
    if not reservation_unit_pk:
        return initial_values

    runit = ReservationUnit.objects.filter(pk=int(reservation_unit_pk)).first()
    if not runit:
        return initial_values

    initial_values["reservation_unit_name"] = runit.name

    for lang in ["fi", "sv", "en"]:
        initial_values[f"confirmed_instructions_{lang}"] = getattr(
            runit, f"reservation_confirmed_instructions_{lang}", ""
        )
        initial_values[f"pending_instructions_{lang}"] = getattr(
            runit, f"reservation_pending_instructions_{lang}", ""
        )
        initial_values[f"cancelled_instructions_{lang}"] = getattr(
            runit, f"reservation_cancelled_instructions_{lang}", ""
        )

    initial_values["unit_name"] = getattr(runit.unit, "name", "")

    location = getattr(runit.unit, "location", None)
    if location:
        initial_values[
            "unit_location"
        ] = f"{location.address_street} {location.address_zip} {location.address_city}"

    return initial_values


class EmailTemplateAdminForm(ModelForm):
    required_fields = ["content_fi", "subject_fi"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        existing_types = EmailTemplate.objects.values_list("type", flat=True)
        if self.instance and self.instance.type:
            existing_types = existing_types.exclude(type=self.instance.type)

        available_types = [
            (value, label)
            for value, label in EmailType.choices
            if value not in existing_types
        ]
        self.fields["type"].choices = [
            (value, label) for value, label in available_types
        ]
        self.test_context = EmailNotificationContext.with_mock_data().__dict__

    def get_validated_field(self, field):
        data = self.cleaned_data[field]
        if data is None:
            if field in self.required_fields:
                raise ValidationError(f"Field {field} is required.")
            return data
        try:
            EmailTemplateValidator().validate_string(
                data, context_dict=self.test_context
            )
        except EmailTemplateValidationError as e:
            raise ValidationError(e.message) from e
        return data

    def validate_uploaded_html_file(self, language: str):
        file = self.cleaned_data[f"html_content_{language}"]
        if file and isinstance(file, InMemoryUploadedFile):
            EmailTemplateValidator().validate_html_file(
                file, context_dict=self.test_context
            )
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
    def template_tester(self, request):
        context = self.admin_site.each_context(request)

        if request.method == "POST":
            form = EmailTestForm(request.POST)

            if form.is_valid():
                template = EmailTemplate.objects.filter(
                    pk=request.POST["template"]
                ).first()
                send_test_emails(template, form)
                return redirect(
                    "/admin/email_notification/emailtemplate/template_tester/"
                )

            context["form"] = form
            context["runit_form"] = ReservationUnitSelectForm()
            return TemplateResponse(request, "email_tester.html", context=context)

        initial_values = get_initial_values(request)
        form = EmailTestForm(initial=initial_values)

        context["form"] = form
        context["runit_form"] = ReservationUnitSelectForm()

        return TemplateResponse(request, "email_tester.html", context=context)
