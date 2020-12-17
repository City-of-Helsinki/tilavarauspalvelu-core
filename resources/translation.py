from modeltranslation.translator import translator, TranslationOptions
from .models import Resource


class ResourceTranslationOptions(TranslationOptions):
    fields = ["name"]


translator.register(Resource, ResourceTranslationOptions)
