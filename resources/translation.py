from modeltranslation.translator import TranslationOptions, register

from resources.models import Resource


@register(Resource)
class ResourceTranslationOptions(TranslationOptions):
    fields = ["name"]
