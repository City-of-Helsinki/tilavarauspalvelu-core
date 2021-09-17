from modeltranslation.translator import TranslationOptions, translator

from .models import Resource


class ResourceTranslationOptions(TranslationOptions):
    fields = ["name", "description"]


translator.register(Resource, ResourceTranslationOptions)
