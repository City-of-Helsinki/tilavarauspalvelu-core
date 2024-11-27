from __future__ import annotations

from functools import wraps
from typing import TYPE_CHECKING, ParamSpec, TypeVar

from django.conf import settings
from django.utils import translation
from modeltranslation.decorators import register
from modeltranslation.translator import TranslationOptions

from .models import (
    AbilityGroup,
    Address,
    ApplicationRound,
    BannerNotification,
    Building,
    City,
    Equipment,
    EquipmentCategory,
    Keyword,
    KeywordCategory,
    KeywordGroup,
    Location,
    Organisation,
    Purpose,
    Qualifier,
    RealEstate,
    ReservationCancelReason,
    ReservationDenyReason,
    ReservationPurpose,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitType,
    Resource,
    Space,
    TermsOfUse,
    Unit,
    UnitGroup,
)

if TYPE_CHECKING:
    from collections.abc import Callable

    from django.db import models
    from django.utils.functional import Promise

    from .models import User
    from .typing import Lang

__all__ = [
    "get_attr_by_language",
    "get_translated",
    "get_translated",
    "translate_for_user",
]


@register(TermsOfUse)
class TermsOfUseTranslationOptions(TranslationOptions):
    fields = ["name", "text"]


@register(Resource)
class ResourceTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Space)
class SpaceTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(UnitGroup)
class UnitGroupTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Unit)
class UnitTranslationOptions(TranslationOptions):
    fields = ["name", "description", "short_description"]


@register(RealEstate)
class RealEstateTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Building)
class BuildingTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Location)
class LocationTranslationOptions(TranslationOptions):
    fields = ["address_street", "address_city"]


@register(AbilityGroup)
class AbilityGroupTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(ReservationPurpose)
class ReservationPurposeTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(ReservationCancelReason)
class ReservationCancelReasonTranslationOptions(TranslationOptions):
    fields = ["reason"]


@register(ReservationDenyReason)
class ReservationDenyReasonTranslationOptions(TranslationOptions):
    fields = ["reason"]


@register(ReservationUnit)
class ReservationUnitTranslationOptions(TranslationOptions):
    fields = [
        "name",
        "description",
        "terms_of_use",
        "reservation_pending_instructions",
        "reservation_confirmed_instructions",
        "reservation_cancelled_instructions",
    ]


@register(ReservationUnitType)
class ReservationUnitTypeTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(KeywordCategory)
class KeywordCategoryTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(KeywordGroup)
class KeywordGroupTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Keyword)
class KeywordTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Purpose)
class PurposeTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Qualifier)
class QualifierTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Equipment)
class EquipmentTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(EquipmentCategory)
class EquipmentCategoryTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(ReservationUnitCancellationRule)
class ReservationUnitCancellationRuleTranslationOptions(TranslationOptions):
    fields = ["name"]


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


@register(BannerNotification)
class BannerNotificationTranslationOptions(TranslationOptions):
    fields = ["message"]


P = ParamSpec("P")
R = TypeVar("R")


def get_translated(func: Callable[P, R]) -> Callable[P, R]:
    """
    Wraps a function so that it's contents are translated using the language
    in the function's 'language' keyword argument. By default, translations will be made in Finnish.
    """

    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        language = kwargs.get("language", settings.LANGUAGE_CODE)
        with translation.override(language=language):
            return func(*args, **kwargs)

    return wrapper


def get_attr_by_language(instance: models.Model | None, field: str, language: Lang) -> str:
    """Get field value by language, or fallback to default language"""
    localised_value = getattr(instance, f"{field}_{language}", None)
    if localised_value:
        return localised_value
    return getattr(instance, field, "")


def translate_for_user(text: Promise, user: User) -> str:
    """
    Translate the given text based on the user's preferred language.
    If the user has no language set, use the default language of Finnish.
    """
    with translation.override(user.get_preferred_language()):
        return str(text)
