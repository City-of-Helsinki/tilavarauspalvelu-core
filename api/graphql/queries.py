"""
Import all ObjectTypes backing django models to this file.
This avoids issues in creating mutation classes (see mutation.py for more information).
Note that the type should be imported here even if it's not imported to schema.py,
simply so that it's registered before any mutations.
"""

from .types.address.types import AddressNode
from .types.allocated_time_slot.types import AllocatedTimeSlotNode
from .types.application.types import ApplicationNode
from .types.application_round.types import ApplicationRoundNode
from .types.application_round_time_slot.types import ApplicationRoundTimeSlotNode
from .types.application_section.types import ApplicationSectionNode
from .types.banner_notification.types import BannerNotificationNode
from .types.city.types import CityNode
from .types.equipment.types import EquipmentType
from .types.equipment_category.types import EquipmentCategoryType
from .types.keyword.types import KeywordCategoryType, KeywordGroupType, KeywordType
from .types.location.types import LocationType
from .types.merchants.types import PaymentMerchantType, PaymentOrderType, PaymentProductType
from .types.organization.types import OrganisationNode
from .types.permissions.types import (
    GeneralRolePermissionType,
    GeneralRoleType,
    RoleType,
    ServiceSectorRolePermissionType,
    ServiceSectorRoleType,
    UnitRolePermissionType,
    UnitRoleType,
)
from .types.person.types import PersonNode
from .types.purpose.types import PurposeType
from .types.qualifier.types import QualifierType
from .types.reservation_unit.types import ReservationUnitNode
from .types.reservation_unit_cancellation_rule.types import ReservationUnitCancellationRuleType
from .types.reservation_unit_image.types import ReservationUnitImageType
from .types.reservation_unit_option.types import ReservationUnitOptionNode
from .types.reservation_unit_payment_type.types import ReservationUnitPaymentTypeType
from .types.reservation_unit_pricing.types import ReservationUnitPricingNode
from .types.reservation_unit_type.types import ReservationUnitTypeNode
from .types.reservations.types import (
    AgeGroupType,
    RecurringReservationType,
    ReservationCancelReasonType,
    ReservationDenyReasonType,
    ReservationMetadataSetType,
    ReservationPurposeType,
    ReservationType,
)
from .types.resources.types import ResourceType
from .types.service_sector.types import ServiceSectorType
from .types.services.types import ServiceNode
from .types.spaces.types import SpaceType
from .types.suitable_time_range.types import SuitableTimeRangeNode
from .types.tax_percentage.types import TaxPercentageNode
from .types.terms_of_use.types import TermsOfUseType
from .types.units.types import UnitByPkType, UnitGroupType, UnitType
from .types.users.types import ApplicantNode, UserType

__all__ = [
    "AddressNode",
    "AgeGroupType",
    "AllocatedTimeSlotNode",
    "ApplicantNode",
    "ApplicationNode",
    "ApplicationRoundNode",
    "ApplicationRoundTimeSlotNode",
    "ApplicationSectionNode",
    "BannerNotificationNode",
    "CityNode",
    "EquipmentCategoryType",
    "EquipmentType",
    "GeneralRolePermissionType",
    "GeneralRoleType",
    "KeywordCategoryType",
    "KeywordGroupType",
    "KeywordType",
    "LocationType",
    "OrganisationNode",
    "PaymentMerchantType",
    "PaymentOrderType",
    "PaymentProductType",
    "PersonNode",
    "PurposeType",
    "QualifierType",
    "RecurringReservationType",
    "ReservationCancelReasonType",
    "ReservationDenyReasonType",
    "ReservationMetadataSetType",
    "ReservationPurposeType",
    "ReservationType",
    "ReservationUnitCancellationRuleType",
    "ReservationUnitImageType",
    "ReservationUnitNode",
    "ReservationUnitOptionNode",
    "ReservationUnitPaymentTypeType",
    "ReservationUnitPricingNode",
    "ReservationUnitTypeNode",
    "ResourceType",
    "RoleType",
    "ServiceNode",
    "ServiceSectorRolePermissionType",
    "ServiceSectorRoleType",
    "ServiceSectorType",
    "SpaceType",
    "SuitableTimeRangeNode",
    "TaxPercentageNode",
    "TermsOfUseType",
    "UnitByPkType",
    "UnitGroupType",
    "UnitRolePermissionType",
    "UnitRoleType",
    "UnitType",
    "UserType",
]
