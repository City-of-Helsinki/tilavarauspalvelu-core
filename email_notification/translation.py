from modeltranslation.translator import TranslationOptions, register

from email_notification.models import EmailTemplate


@register(EmailTemplate)
class EmailTemplateTranslationOptions(TranslationOptions):
    fields = ["subject", "content", "html_content"]
