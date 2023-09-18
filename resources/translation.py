from modeltranslation.translator import TranslationOptions, translator

from resources.models import Resource


class ResourceTranslationOptions(TranslationOptions):
    fields = ["name"]


translator.register(Resource, ResourceTranslationOptions)
