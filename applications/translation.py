from modeltranslation.translator import TranslationOptions, translator

from applications.models import ApplicationRound


class ApplicationRoundTranslationOptions(TranslationOptions):
    fields = ["name", "criteria"]


translator.register(ApplicationRound, ApplicationRoundTranslationOptions)
