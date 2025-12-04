from __future__ import annotations

from functools import wraps
from typing import TYPE_CHECKING

from django.conf import settings
from django.utils import translation
from lazy_managers import LazyModelManager
from modeltranslation.decorators import register
from modeltranslation.translator import TranslationOptions

from .models import (
    ApplicationRound,
    BannerNotification,
    Equipment,
    EquipmentCategory,
    IntendedUse,
    ReservationDenyReason,
    ReservationPurpose,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitPricing,
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
    "translated",
]


def register_lazy[TOpt: type[TranslationOptions]](model: type[models.Model]) -> Callable[[TOpt], TOpt]:
    """Load lazy loaded managers before patching them for django-modeltranslation."""
    for manager in model._meta.managers:
        if isinstance(manager, LazyModelManager):
            real_manager = manager._load_manager()  # noqa: SLF001
            manager._replace_manager(real_manager, manager.model, manager.name)  # noqa: SLF001

    return register(model)


@register_lazy(ApplicationRound)
class ApplicationRoundTranslationOptions(TranslationOptions):
    fields = ["name", "criteria", "notes_when_applying"]


@register_lazy(BannerNotification)
class BannerNotificationTranslationOptions(TranslationOptions):
    fields = ["message"]


@register_lazy(Equipment)
class EquipmentTranslationOptions(TranslationOptions):
    fields = ["name"]


@register_lazy(EquipmentCategory)
class EquipmentCategoryTranslationOptions(TranslationOptions):
    fields = ["name"]


@register_lazy(IntendedUse)
class IntendedUseTranslationOptions(TranslationOptions):
    fields = ["name"]


@register_lazy(ReservationDenyReason)
class ReservationDenyReasonTranslationOptions(TranslationOptions):
    fields = ["reason"]


@register_lazy(ReservationPurpose)
class ReservationPurposeTranslationOptions(TranslationOptions):
    fields = ["name"]


@register_lazy(ReservationUnit)
class ReservationUnitTranslationOptions(TranslationOptions):
    fields = [
        "name",
        "description",
        "notes_when_applying",
        "reservation_pending_instructions",
        "reservation_confirmed_instructions",
        "reservation_cancelled_instructions",
    ]


@register_lazy(ReservationUnitCancellationRule)
class ReservationUnitCancellationRuleTranslationOptions(TranslationOptions):
    fields = ["name"]


@register_lazy(ReservationUnitType)
class ReservationUnitTypeTranslationOptions(TranslationOptions):
    fields = ["name"]


@register_lazy(ReservationUnitPricing)
class ReservationUnitPricingTranslationOptions(TranslationOptions):
    fields = ["material_price_description"]


@register_lazy(Resource)
class ResourceTranslationOptions(TranslationOptions):
    fields = ["name"]


@register_lazy(Space)
class SpaceTranslationOptions(TranslationOptions):
    fields = ["name"]


@register_lazy(TermsOfUse)
class TermsOfUseTranslationOptions(TranslationOptions):
    fields = ["name", "text"]


@register_lazy(Unit)
class UnitTranslationOptions(TranslationOptions):
    fields = [
        "name",
        "description",
        "short_description",
        "address_street",
        "address_city",
    ]


@register_lazy(UnitGroup)
class UnitGroupTranslationOptions(TranslationOptions):
    fields = ["name"]


def get_translated[**P, R](func: Callable[P, R]) -> Callable[P, R]:
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


def translated(text: Promise | str, lang: Lang) -> str:
    """Translate the given text based the given language."""
    with translation.override(lang):
        return str(text)
