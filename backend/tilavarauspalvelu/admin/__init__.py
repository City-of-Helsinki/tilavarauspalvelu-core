from __future__ import annotations

from .age_group.admin import AgeGroupAdmin
from .allocated_timeslot.admin import AllocatedTimeSlotAdmin
from .application.admin import ApplicationAdmin
from .application_round.admin import ApplicationRoundAdmin
from .application_section.admin import ApplicationSectionAdmin
from .banner_notification.admin import BannerNotificationAdmin
from .email_message.admin import EmailMessageAdmin
from .equipment.admin import EquipmentAdmin
from .equipment_category.admin import EquipmentCategoryAdmin
from .general_role.admin import GeneralRoleAdmin
from .intended_use.admin import IntendedUseAdmin
from .log_entry.admin import LogEntryAdmin
from .origin_hauki_resource.admin import OriginHaukiResourceAdmin
from .payment_accounting.admin import PaymentAccountingAdmin
from .payment_merchant.admin import PaymentMerchantAdmin
from .payment_order.admin import PaymentOrderAdmin
from .rejected_occurrence.admin import RejectedOccurrenceAdmin
from .reservation.admin import ReservationAdmin
from .reservation_deny_reason.admin import ReservationDenyReasonAdmin
from .reservation_purpose.admin import ReservationPurposeAdmin
from .reservation_series.admin import ReservationSeriesAdmin
from .reservation_statistic.admin import ReservationStatisticAdmin
from .reservation_unit.admin import ReservationUnitAdmin
from .reservation_unit_access_type.admin import ReservationUnitAccessTypeAdmin
from .reservation_unit_cancellation_rule.admin import ReservationUnitCancellationRuleAdmin
from .reservation_unit_image.admin import ReservationUnitImageAdmin
from .reservation_unit_option.admin import ReservationUnitOptionAdmin
from .reservation_unit_pricing.admin import ReservationUnitPricingAdmin
from .reservation_unit_type.admin import ReservationUnitTypeAdmin
from .resource.admin import ResourceAdmin
from .space.admin import SpaceAdmin
from .tax_percentage.admin import TaxPercentageAdmin
from .terms_of_use.admin import TermsOfUseAdmin
from .unit.admin import UnitAdmin
from .unit_group.admin import UnitGroupAdmin
from .unit_role.admin import UnitRoleAdmin
from .user.admin import UserAdmin

__all__ = [
    "AgeGroupAdmin",
    "AllocatedTimeSlotAdmin",
    "ApplicationAdmin",
    "ApplicationRoundAdmin",
    "ApplicationSectionAdmin",
    "BannerNotificationAdmin",
    "EmailMessageAdmin",
    "EquipmentAdmin",
    "EquipmentCategoryAdmin",
    "GeneralRoleAdmin",
    "IntendedUseAdmin",
    "LogEntryAdmin",
    "OriginHaukiResourceAdmin",
    "PaymentAccountingAdmin",
    "PaymentMerchantAdmin",
    "PaymentOrderAdmin",
    "RejectedOccurrenceAdmin",
    "ReservationAdmin",
    "ReservationDenyReasonAdmin",
    "ReservationPurposeAdmin",
    "ReservationSeriesAdmin",
    "ReservationStatisticAdmin",
    "ReservationUnitAccessTypeAdmin",
    "ReservationUnitAdmin",
    "ReservationUnitCancellationRuleAdmin",
    "ReservationUnitImageAdmin",
    "ReservationUnitOptionAdmin",
    "ReservationUnitPricingAdmin",
    "ReservationUnitTypeAdmin",
    "ResourceAdmin",
    "SpaceAdmin",
    "TaxPercentageAdmin",
    "TermsOfUseAdmin",
    "UnitAdmin",
    "UnitGroupAdmin",
    "UnitRoleAdmin",
    "UserAdmin",
]
