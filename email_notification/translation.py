from modeltranslation.translator import TranslationOptions, translator

from email_notification.models import EmailTemplate


class EmailTemplateTranslationOptions(TranslationOptions):
    fields = ["subject", "content", "html_content"]


translator.register(EmailTemplate, EmailTemplateTranslationOptions)
