"""
Import all ObjectTypes backing django models to this file.
This avoids issues in creating mutation classes (see mutation.py for more information).
Note that the type should be imported here even if it's not imported to `schema.py`,
simply so that it's registered before any mutations.
"""

from .types.ability_group.types import AbilityGroupNode
from .types.address.types import AddressNode
from .types.age_group.types import AgeGroupNode
from .types.allocated_time_slot.types import AllocatedTimeSlotNode
from .types.application.types import ApplicationNode
from .types.application_round.types import ApplicationRoundNode
from .types.application_round_time_slot.types import ApplicationRoundTimeSlotNode
from .types.application_section.types import ApplicationSectionNode
from .types.banner_notification.types import BannerNotificationNode
from .types.city.types import CityNode
from .types.equipment.types import EquipmentNode
from .types.equipment_category.types import EquipmentCategoryNode
from .types.helsinki_profile.types import HelsinkiProfileDataNode
from .types.keyword.types import KeywordCategoryNode, KeywordGroupNode, KeywordNode
from .types.location.types import LocationNode
from .types.merchants.types import PaymentMerchantNode, PaymentOrderNode, PaymentProductNode
from .types.organisation.types import OrganisationNode
from .types.permissions.types import (
    GeneralRoleChoiceNode,
    GeneralRoleNode,
    GeneralRolePermissionNode,
    ServiceSectorRoleChoiceNode,
    ServiceSectorRoleNode,
    ServiceSectorRolePermissionNode,
    UnitRoleChoiceNode,
    UnitRoleNode,
    UnitRolePermissionNode,
)
from .types.person.types import PersonNode
from .types.purpose.types import PurposeNode
from .types.qualifier.types import QualifierNode
from .types.recurring_reservation.types import RecurringReservationNode
from .types.reservation.types import ReservationNode
from .types.reservation_cancel_reason.types import ReservationCancelReasonNode
from .types.reservation_deny_reason.types import ReservationDenyReasonNode
from .types.reservation_metadata.types import ReservationMetadataFieldNode, ReservationMetadataSetNode
from .types.reservation_purpose.types import ReservationPurposeNode
from .types.reservation_unit.types import ReservationUnitNode
from .types.reservation_unit_cancellation_rule.types import ReservationUnitCancellationRuleNode
from .types.reservation_unit_image.types import ReservationUnitImageNode
from .types.reservation_unit_option.types import ReservationUnitOptionNode
from .types.reservation_unit_payment_type.types import ReservationUnitPaymentTypeNode
from .types.reservation_unit_pricing.types import ReservationUnitPricingNode
from .types.reservation_unit_type.types import ReservationUnitTypeNode
from .types.resource.types import ResourceNode
from .types.service.types import ServiceNode
from .types.service_sector.types import ServiceSectorNode
from .types.space.types import SpaceNode
from .types.suitable_time_range.types import SuitableTimeRangeNode
from .types.tax_percentage.types import TaxPercentageNode
from .types.terms_of_use.types import TermsOfUseNode
from .types.unit.types import UnitNode
from .types.unit_group.types import UnitGroupNode
from .types.user.types import ApplicantNode, UserNode

__all__ = [
    "AbilityGroupNode",
    "AddressNode",
    "AgeGroupNode",
    "AllocatedTimeSlotNode",
    "ApplicantNode",
    "ApplicationNode",
    "ApplicationRoundNode",
    "ApplicationRoundTimeSlotNode",
    "ApplicationSectionNode",
    "BannerNotificationNode",
    "CityNode",
    "EquipmentCategoryNode",
    "EquipmentNode",
    "GeneralRoleChoiceNode",
    "GeneralRoleNode",
    "GeneralRolePermissionNode",
    "HelsinkiProfileDataNode",
    "KeywordCategoryNode",
    "KeywordGroupNode",
    "KeywordNode",
    "LocationNode",
    "OrganisationNode",
    "PaymentMerchantNode",
    "PaymentOrderNode",
    "PaymentProductNode",
    "PersonNode",
    "PurposeNode",
    "QualifierNode",
    "RecurringReservationNode",
    "ReservationCancelReasonNode",
    "ReservationDenyReasonNode",
    "ReservationMetadataFieldNode",
    "ReservationMetadataSetNode",
    "ReservationNode",
    "ReservationPurposeNode",
    "ReservationUnitCancellationRuleNode",
    "ReservationUnitImageNode",
    "ReservationUnitNode",
    "ReservationUnitOptionNode",
    "ReservationUnitPaymentTypeNode",
    "ReservationUnitPricingNode",
    "ReservationUnitTypeNode",
    "ResourceNode",
    "ServiceNode",
    "ServiceSectorNode",
    "ServiceSectorRoleChoiceNode",
    "ServiceSectorRoleNode",
    "ServiceSectorRolePermissionNode",
    "SpaceNode",
    "SuitableTimeRangeNode",
    "TaxPercentageNode",
    "TermsOfUseNode",
    "UnitGroupNode",
    "UnitNode",
    "UnitRoleChoiceNode",
    "UnitRoleNode",
    "UnitRolePermissionNode",
    "UserNode",
]
