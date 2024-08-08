from modeltranslation.translator import TranslationOptions, register

from applications.models import Address, ApplicationRound, City, Organisation


@register(Address)
class AddressTranslationOptions(TranslationOptions):
    fields = ["street_address", "city"]


@register(Organisation)
class OrganisationTranslationOptions(TranslationOptions):
    fields = ["name", "core_business"]


@register(ApplicationRound)
class ApplicationRoundTranslationOptions(TranslationOptions):
    fields = ["name", "criteria", "notes_when_applying"]


@register(City)
class CityTranslationOptions(TranslationOptions):
    fields = ["name"]
