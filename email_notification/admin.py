from django.contrib import admin
from django.forms import ModelForm, ValidationError

from email_notification.models import EmailTemplate, EmailType
from email_notification.sender.email_notification_builder import (
    EmailTemplateValidationError,
    EmailTemplateValidator,
)


class EmailTemplateAdminForm(ModelForm):
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

    def clean_subject(self):
        subject = self.cleaned_data["subject"]
        try:
            EmailTemplateValidator().validate_string(subject)
        except EmailTemplateValidationError as e:
            raise ValidationError(e.message) from e
        return subject

    def clean_content(self):
        content = self.cleaned_data["content"]
        try:
            EmailTemplateValidator().validate_string(content)
        except EmailTemplateValidationError as e:
            raise ValidationError(e.message) from e
        return content


@admin.register(EmailTemplate)
class EmailTemplateAdmin(admin.ModelAdmin):
    model = EmailTemplate
    form = EmailTemplateAdminForm
