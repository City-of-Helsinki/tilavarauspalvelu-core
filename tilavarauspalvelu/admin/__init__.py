from .email_template.admin import EmailTemplateAdmin
from .general_role.admin import GeneralRoleAdmin
from .payment_accounting.admin import PaymentAccountingAdmin
from .payment_merchant.admin import PaymentMerchantAdmin
from .payment_order.admin import PaymentOrderAdmin
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
    "EmailTemplateAdmin",
    "GeneralRoleAdmin",
    "PaymentAccountingAdmin",
    "PaymentMerchantAdmin",
    "PaymentOrderAdmin",
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
