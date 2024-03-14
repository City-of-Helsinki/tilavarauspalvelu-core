from admin_extra_buttons.api import ExtraButtonsMixin, button
from django.contrib import admin
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.db.models.fields.files import FieldFile
from django.forms import ModelForm, ValidationError
from django.http import HttpResponseRedirect
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from django.urls import reverse
from django.utils.translation import gettext_lazy as _

from email_notification.admin.email_tester import (
    EmailTemplateTesterForm,
    EmailTemplateTesterReservationUnitSelectForm,
    get_email_template_tester_form_initial_values,
)
from email_notification.exceptions import EmailTemplateValidationError
from email_notification.models import EmailTemplate, EmailType
from email_notification.sender.email_notification_builder import EmailNotificationContext
from email_notification.sender.email_notification_sender import EmailNotificationSender
from email_notification.sender.email_notification_validator import EmailTemplateValidator


class EmailTemplateAdminForm(ModelForm):
    required_fields = ["content_fi", "subject_fi"]

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)

        existing_types = EmailTemplate.objects.values_list("type", flat=True)
        if self.instance and self.instance.type:
            existing_types = existing_types.exclude(type=self.instance.type)

        available_types = [(value, label) for value, label in EmailType.choices if value not in existing_types]
        self.fields["type"].choices = list(available_types)
        self.test_context = EmailNotificationContext.with_mock_data().__dict__

    def _get_validated_field(self, field) -> str | None:
        data: str | None = self.cleaned_data[field]

        if not data:
            if field in self.required_fields:
                raise ValidationError(f"Field {field} is required.")
            return data

        try:
            EmailTemplateValidator().validate_string(data, context_dict=self.test_context)
        except EmailTemplateValidationError as e:
            raise ValidationError(e.message) from e
        return data

    def _get_validated_html_file(self, language: str) -> InMemoryUploadedFile | FieldFile | None:
        file: InMemoryUploadedFile | FieldFile | None = self.cleaned_data[f"html_content_{language}"]

        if file and isinstance(file, InMemoryUploadedFile):
            EmailTemplateValidator().validate_html_file(file, context_dict=self.test_context)

        return file

    def clean_subject(self) -> str | None:
        return self._get_validated_field("subject")

    def clean_subject_en(self) -> str | None:
        return self._get_validated_field("subject_en")

    def clean_subject_sv(self) -> str | None:
        return self._get_validated_field("subject_sv")

    def clean_content(self) -> str | None:
        return self._get_validated_field("content")

    def clean_content_en(self) -> str | None:
        return self._get_validated_field("content_en")

    def clean_content_sv(self) -> str | None:
        return self._get_validated_field("content_sv")

    def clean_html_content_fi(self) -> InMemoryUploadedFile | FieldFile | None:
        return self._get_validated_html_file("fi")

    def clean_html_content_en(self) -> InMemoryUploadedFile | FieldFile | None:
        return self._get_validated_html_file("en")

    def clean_html_content_sv(self) -> InMemoryUploadedFile | FieldFile | None:
        return self._get_validated_html_file("sv")


@admin.register(EmailTemplate)
class EmailTemplateAdmin(ExtraButtonsMixin, admin.ModelAdmin):
    model = EmailTemplate
    form = EmailTemplateAdminForm
    exclude = ["html_content"]

    @button(label="Email Template Testing")
    def template_tester(self, request, extra_context=None) -> TemplateResponse | HttpResponseRedirect:
        if request.method == "POST":
            form = EmailTemplateTesterForm(request.POST)
            if form.is_valid():
                template = EmailTemplate.objects.filter(pk=request.POST["template"]).first()

                email_notification_sender = EmailNotificationSender(email_type=template.type, recipients=None)
                email_notification_sender.send_test_emails(form=form)

                self.message_user(request, _("Test Email '%s' successfully sent.") % template.name)

                template_admin_url = reverse("admin:email_notification_emailtemplate_change", args=[template.id])
                return redirect(f"{template_admin_url}template_tester/")
        else:
            initial_values = get_email_template_tester_form_initial_values(request)
            form = EmailTemplateTesterForm(initial=initial_values)

        context = self.admin_site.each_context(request)
        context["opts"] = self.model._meta
        context["form"] = form
        context["reservation_unit_form"] = EmailTemplateTesterReservationUnitSelectForm()

        return TemplateResponse(request, "email_tester.html", context=context)
