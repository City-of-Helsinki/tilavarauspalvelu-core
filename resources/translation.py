from modeltranslation.translator import TranslationOptions, translator

from .models import Resource


class ResourceTranslationOptions(TranslationOptions):
    fields = ["name"]


translator.register(Resource, ResourceTranslationOptions)
