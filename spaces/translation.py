from modeltranslation.translator import translator, TranslationOptions
from .models import Space


class SpaceTranslationOptions(TranslationOptions):
    fields = ["name"]


translator.register(Space, SpaceTranslationOptions)
