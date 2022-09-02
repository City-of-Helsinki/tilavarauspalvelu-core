from django.contrib import admin
from django.forms import ModelForm, ValidationError

from email_notification.models import EmailTemplate, EmailType
from email_notification.sender.email_notification_builder import (
    EmailTemplateValidationError,
    EmailTemplateValidator,
)


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


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    model = EmailTemplate
    form = EmailTemplateAdminForm
