from __future__ import annotations

from .ability_group.admin import AbilityGroupAdmin
from .address.admin import AddressAdmin
from .age_group.admin import AgeGroupAdmin
from .allocated_timeslot.admin import AllocatedTimeSlotAdmin
from .application.admin import ApplicationAdmin
from .application_round.admin import ApplicationRoundAdmin
from .application_section.admin import ApplicationSectionAdmin
from .banner_notification.admin import BannerNotificationAdmin
from .bug_report.admin import BugReportAdmin
from .city.admin import CityAdmin
from .equipment.admin import EquipmentAdmin
from .equipment_category.admin import EquipmentCategoryAdmin
from .general_role.admin import GeneralRoleAdmin
from .organisation.admin import OrganisationAdmin
from .origin_hauki_resource.admin import OriginHaukiResourceAdmin
from .payment_accounting.admin import PaymentAccountingAdmin
from .payment_merchant.admin import PaymentMerchantAdmin
from .payment_order.admin import PaymentOrderAdmin
from .person.admin import PersonAdmin
from .purpose.admin import PurposeAdmin
from .qualifier.admin import QualifierAdmin
from .recurring_reservation.admin import RecurringReservationAdmin
from .request_log.admin import RequestLogAdmin
from .reservation.admin import ReservationAdmin
from .reservation_cancel_reason.admin import ReservationCancelReasonAdmin
from .reservation_deny_reason.admin import ReservationDenyReasonAdmin
from .reservation_metadata_field.admin import ReservationMetadataFieldAdmin
from .reservation_metadata_set.admin import ReservationMetadataSetAdmin
from .reservation_purpose.admin import ReservationPurposeAdmin
from .reservation_statistic.admin import ReservationStatisticAdmin
from .reservation_unit.admin import ReservationUnitAdmin
from .reservation_unit_cancellation_rule.admin import ReservationUnitCancellationRuleAdmin
from .reservation_unit_image.admin import ReservationUnitImageAdmin
from .reservation_unit_pricing.admin import ReservationUnitPricingAdmin
from .reservation_unit_type.admin import ReservationUnitTypeAdmin
from .resource.admin import ResourceAdmin
from .space.admin import SpaceAdmin
from .sql_log.admin import SQLLogAdmin
from .tax_percentage.admin import TaxPercentageAdmin
from .terms_of_use.admin import TermsOfUseAdmin
from .unit.admin import UnitAdmin
from .unit_group.admin import UnitGroupAdmin
from .unit_role.admin import UnitRoleAdmin
from .user.admin import UserAdmin

__all__ = [
    "AbilityGroupAdmin",
    "AddressAdmin",
    "AgeGroupAdmin",
    "AllocatedTimeSlotAdmin",
    "ApplicationAdmin",
    "ApplicationRoundAdmin",
    "ApplicationSectionAdmin",
    "BannerNotificationAdmin",
    "BugReportAdmin",
    "CityAdmin",
    "EquipmentAdmin",
    "EquipmentCategoryAdmin",
    "GeneralRoleAdmin",
    "OrganisationAdmin",
    "OriginHaukiResourceAdmin",
    "PaymentAccountingAdmin",
    "PaymentMerchantAdmin",
    "PaymentOrderAdmin",
    "PersonAdmin",
    "PurposeAdmin",
    "QualifierAdmin",
    "RecurringReservationAdmin",
    "RequestLogAdmin",
    "ReservationAdmin",
    "ReservationCancelReasonAdmin",
    "ReservationDenyReasonAdmin",
    "ReservationMetadataFieldAdmin",
    "ReservationMetadataSetAdmin",
    "ReservationPurposeAdmin",
    "ReservationStatisticAdmin",
    "ReservationUnitAdmin",
    "ReservationUnitCancellationRuleAdmin",
    "ReservationUnitImageAdmin",
    "ReservationUnitPricingAdmin",
    "ReservationUnitTypeAdmin",
    "ResourceAdmin",
    "SQLLogAdmin",
    "SpaceAdmin",
    "TaxPercentageAdmin",
    "TermsOfUseAdmin",
    "UnitAdmin",
    "UnitGroupAdmin",
    "UnitRoleAdmin",
    "UserAdmin",
]
