from modeltranslation.translator import TranslationOptions, translator

from .models import (
    Address,
    ApplicationEvent,
    ApplicationRound,
    ApplicationRoundBasket,
    City,
    Organisation,
)


class AddressTranslationOptions(TranslationOptions):
    fields = ["street_address", "city"]


class OrganisationTranslationOptions(TranslationOptions):
    fields = ["name", "core_business"]


class ApplicationRoundTranslationOptions(TranslationOptions):
    fields = ["name", "criteria"]


class CityTranslationOptions(TranslationOptions):
    fields = ["name"]


class ApplicationRoundBasketTranslationOptions(TranslationOptions):
    fields = ["name"]


class ApplicationEventTranslationOptions(TranslationOptions):
    fields = ["name"]


translator.register(Address, AddressTranslationOptions)
translator.register(Organisation, OrganisationTranslationOptions)
translator.register(ApplicationRound, ApplicationRoundTranslationOptions)
translator.register(City, CityTranslationOptions)
translator.register(ApplicationRoundBasket, ApplicationRoundBasketTranslationOptions)
translator.register(ApplicationEvent, ApplicationEventTranslationOptions)
