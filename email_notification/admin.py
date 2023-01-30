from admin_extra_buttons.api import ExtraButtonsMixin, button
from django.contrib import admin
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.forms import ModelForm, ValidationError
from django.http import HttpResponse
from django.template.response import TemplateResponse

from email_notification.email_tester import EmailTestForm
from email_notification.models import EmailTemplate, EmailType
from email_notification.sender.email_notification_builder import (
    EmailNotificationContext,
    EmailTemplateValidationError,
    EmailTemplateValidator,
)
from email_notification.sender.senders import send_reservation_email_notification


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

    def get_validated_field(self, field):
        data = self.cleaned_data[field]
        if data is None:
            if field in self.required_fields:
                raise ValidationError(f"Field {field} is required.")
            return data
        try:
            EmailTemplateValidator().validate_string(data)
        except EmailTemplateValidationError as e:
            raise ValidationError(e.message) from e
        return data

    def validate_uploaded_html_file(self, language: str):
        file = self.cleaned_data[f"html_content_{language}"]
        if file and isinstance(file, InMemoryUploadedFile):
            EmailTemplateValidator().validate_html_file(file)
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
                context = EmailNotificationContext.from_form(form)
                for language in ["fi", "sv", "en"]:
                    context.reservee_language = language
                    send_reservation_email_notification(
                        EmailType.STAFF_NOTIFICATION_RESERVATION_MADE,
                        None,
                        recipients=[form.cleaned_data["recipient"]],
                        context=context,
                    )
                return HttpResponse(request.POST.items())

        else:
            recipient = request.user.email if request.user else ""
            form = EmailTestForm(initial={"recipient": recipient})

        context["form"] = form
        return TemplateResponse(request, "email_tester.html", context=context)
