from modeltranslation.translator import TranslationOptions, translator

from .models import EmailTemplate


class EmailTemplateTranslationOptions(TranslationOptions):
    fields = ["subject", "content"]


translator.register(EmailTemplate, EmailTemplateTranslationOptions)
