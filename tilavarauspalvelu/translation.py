from __future__ import annotations

from modeltranslation.decorators import register
from modeltranslation.translator import TranslationOptions

from .models import (
    AbilityGroup,
    ReservationCancelReason,
    ReservationDenyReason,
    ReservationPurpose,
    Service,
    TermsOfUse,
)
from .models.building.model import Building
from .models.email_template.model import EmailTemplate
from .models.equipment.model import Equipment
from .models.equipment_category.model import EquipmentCategory
from .models.keyword.model import Keyword
from .models.keyword_category.model import KeywordCategory
from .models.keyword_group.model import KeywordGroup
from .models.location.model import Location
from .models.purpose.model import Purpose
from .models.qualifier.model import Qualifier
from .models.real_estate.model import RealEstate
from .models.reservation_unit.model import ReservationUnit
from .models.reservation_unit_cancellation_rule.model import ReservationUnitCancellationRule
from .models.reservation_unit_type.model import ReservationUnitType
from .models.resource.model import Resource
from .models.service_sector.model import ServiceSector
from .models.space.model import Space
from .models.unit.model import Unit
from .models.unit_group.model import UnitGroup


@register(Service)
class ServiceTranslationOptions(TranslationOptions):
    fields = ["name"]


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


@register(ServiceSector)
class ServiceSectorTranslationOptions(TranslationOptions):
    fields = ["name"]


@register(Location)
class LocationTranslationOptions(TranslationOptions):
    fields = ["address_street", "address_city"]


@register(EmailTemplate)
class EmailTemplateTranslationOptions(TranslationOptions):
    fields = ["subject", "content", "html_content"]


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
