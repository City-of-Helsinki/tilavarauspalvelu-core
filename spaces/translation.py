from modeltranslation.translator import TranslationOptions, translator

from .models import Space


class SpaceTranslationOptions(TranslationOptions):
    fields = ["name"]


translator.register(Space, SpaceTranslationOptions)
