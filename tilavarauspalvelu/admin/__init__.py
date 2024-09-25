from .ability_group.admin import AbilityGroupAdmin
from .age_group.admin import AgeGroupAdmin
from .email_template.admin import EmailTemplateAdmin
from .general_role.admin import GeneralRoleAdmin
from .origin_hauki_resource.admin import OriginHaukiResourceAdmin
from .payment_accounting.admin import PaymentAccountingAdmin
from .payment_merchant.admin import PaymentMerchantAdmin
from .payment_order.admin import PaymentOrderAdmin
from .recurring_reservation.admin import RecurringReservationAdmin
from .reservation.admin import ReservationAdmin
from .reservation_cancel_reason.admin import ReservationCancelReasonAdmin
from .reservation_deny_reason.admin import ReservationDenyReasonAdmin
from .reservation_metadata_field.admin import ReservationMetadataFieldAdmin
from .reservation_metadata_set.admin import ReservationMetadataSetAdmin
from .reservation_purpose.admin import ReservationPurposeAdmin
from .reservation_statistic.admin import ReservationStatisticAdmin
from .resource.admin import ResourceAdmin
from .service.admin import ServiceAdmin
from .service_sector.admin import ServiceSectorAdmin
from .space.admin import SpaceAdmin
from .terms_of_use.admin import TermsOfUseAdmin
from .unit.admin import UnitAdmin
from .unit_group.admin import UnitGroupAdmin
from .unit_role.admin import UnitRoleAdmin
from .user.admin import UserAdmin

__all__ = [
    "AbilityGroupAdmin",
    "AgeGroupAdmin",
    "EmailTemplateAdmin",
    "GeneralRoleAdmin",
    "OriginHaukiResourceAdmin",
    "PaymentAccountingAdmin",
    "PaymentMerchantAdmin",
    "PaymentOrderAdmin",
    "RecurringReservationAdmin",
    "ReservationAdmin",
    "ReservationCancelReasonAdmin",
    "ReservationDenyReasonAdmin",
    "ReservationMetadataFieldAdmin",
    "ReservationMetadataSetAdmin",
    "ReservationPurposeAdmin",
    "ReservationStatisticAdmin",
    "ResourceAdmin",
    "ServiceAdmin",
    "ServiceSectorAdmin",
    "SpaceAdmin",
    "TermsOfUseAdmin",
    "UnitAdmin",
    "UnitGroupAdmin",
    "UnitRoleAdmin",
    "UserAdmin",
]
