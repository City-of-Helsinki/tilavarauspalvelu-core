from .equipment import EquipmentAdmin
from .equipment_category import EquipmentCategoryAdmin
from .keyword import KeywordAdmin
from .keyword_category import KeywordCategoryAdmin
from .keyword_group import KeywordGroupAdmin
from .purpose import PurposeAdmin
from .reservation_unit import ReservationUnitAdmin
from .reservation_unit_cancellation_rule import ReservationUnitCancellationRuleAdmin
from .reservation_unit_hierarchy import ReservationUnitHierarchyAdmin
from .reservation_unit_image import ReservationUnitImageAdmin
from .reservation_unit_pricing import ReservationUnitPricingAdmin
from .reservation_unit_type import ReservationUnitTypeAdmin
from .tax_percentage import TaxPercentageAdmin

__all__ = [
    "EquipmentAdmin",
    "EquipmentCategoryAdmin",
    "KeywordAdmin",
    "KeywordCategoryAdmin",
    "KeywordGroupAdmin",
    "PurposeAdmin",
    "ReservationUnitAdmin",
    "ReservationUnitCancellationRuleAdmin",
    "ReservationUnitHierarchyAdmin",
    "ReservationUnitImageAdmin",
    "ReservationUnitPricingAdmin",
    "ReservationUnitTypeAdmin",
    "TaxPercentageAdmin",
]
