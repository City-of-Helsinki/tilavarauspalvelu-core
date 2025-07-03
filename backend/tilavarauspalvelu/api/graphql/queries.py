"""
Import all ObjectTypes backing django models to this file.
This avoids issues in creating mutation classes (see mutation.py for more information).
Note that the type should be imported here even if it's not imported to `schema.py`,
simply so that it's registered before any mutations.
"""

from __future__ import annotations

from .types.address.types import AddressNode
from .types.age_group.types import AgeGroupNode
from .types.allocated_time_slot.types import AllocatedTimeSlotNode
from .types.application.types import ApplicationNode
from .types.application_round.types import ApplicationRoundNode
from .types.application_round_time_slot.types import ApplicationRoundTimeSlotNode
from .types.application_section.types import ApplicationSectionNode
from .types.banner_notification.types import BannerNotificationNode
from .types.city.types import CityNode
from .types.equipment.types import EquipmentAllNode, EquipmentNode
from .types.equipment_category.types import EquipmentCategoryNode
from .types.helsinki_profile.types import HelsinkiProfileDataNode
from .types.organisation.types import OrganisationNode
from .types.payment_merchant.types import PaymentMerchantNode
from .types.payment_order.types import PaymentOrderNode
from .types.payment_product.types import PaymentProductNode
from .types.permissions.types import GeneralRoleNode, PermissionCheckerType, UnitRoleNode
from .types.person.types import PersonNode
from .types.purpose.types import PurposeNode
from .types.rejected_occurrence.types import RejectedOccurrenceNode
from .types.reservation.types import ReservationNode
from .types.reservation_cancel_reason.types import ReservationCancelReasonType
from .types.reservation_deny_reason.types import ReservationDenyReasonNode
from .types.reservation_metadata.types import ReservationMetadataFieldNode, ReservationMetadataSetNode
from .types.reservation_purpose.types import ReservationPurposeNode
from .types.reservation_series.types import ReservationSeriesNode
from .types.reservation_unit.types import ReservationUnitAllNode, ReservationUnitNode
from .types.reservation_unit_access_type.types import ReservationUnitAccessTypeNode
from .types.reservation_unit_cancellation_rule.types import ReservationUnitCancellationRuleNode
from .types.reservation_unit_image.types import ReservationUnitImageNode
from .types.reservation_unit_option.types import ReservationUnitOptionNode
from .types.reservation_unit_pricing.types import ReservationUnitPricingNode
from .types.reservation_unit_type.types import ReservationUnitTypeNode
from .types.resource.types import ResourceNode
from .types.space.types import SpaceNode
from .types.suitable_time_range.types import SuitableTimeRangeNode
from .types.tax_percentage.types import TaxPercentageNode
from .types.terms_of_use.types import TermsOfUseNode
from .types.unit.types import UnitAllNode, UnitNode
from .types.unit_group.types import UnitGroupNode
from .types.user.types import ApplicantNode, UserNode

__all__ = [
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
    "EquipmentAllNode",
    "EquipmentCategoryNode",
    "EquipmentNode",
    "GeneralRoleNode",
    "HelsinkiProfileDataNode",
    "OrganisationNode",
    "PaymentMerchantNode",
    "PaymentOrderNode",
    "PaymentProductNode",
    "PermissionCheckerType",
    "PersonNode",
    "PurposeNode",
    "RejectedOccurrenceNode",
    "ReservationCancelReasonType",
    "ReservationDenyReasonNode",
    "ReservationMetadataFieldNode",
    "ReservationMetadataSetNode",
    "ReservationNode",
    "ReservationPurposeNode",
    "ReservationSeriesNode",
    "ReservationUnitAccessTypeNode",
    "ReservationUnitAllNode",
    "ReservationUnitCancellationRuleNode",
    "ReservationUnitImageNode",
    "ReservationUnitNode",
    "ReservationUnitOptionNode",
    "ReservationUnitPricingNode",
    "ReservationUnitTypeNode",
    "ResourceNode",
    "SpaceNode",
    "SuitableTimeRangeNode",
    "TaxPercentageNode",
    "TermsOfUseNode",
    "UnitAllNode",
    "UnitGroupNode",
    "UnitNode",
    "UnitRoleNode",
    "UserNode",
]
