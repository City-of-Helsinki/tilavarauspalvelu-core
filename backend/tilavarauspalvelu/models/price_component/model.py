from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from django_nh3.models import Nh3CharField
from lazy_managers import LazyModelAttribute, LazyModelManager

from tilavarauspalvelu.enums import PaymentType, PriceComponentKind, PriceUnit
from tilavarauspalvelu.typing import error_codes
from utils.auditlog_util import AuditLogger
from utils.fields.model import TextChoicesField

if TYPE_CHECKING:
    import datetime
    from decimal import Decimal

    from lazy_managers import LazyAttribute

    from tilavarauspalvelu.models import PriceOption, PricingGroup

    from .actions import PriceComponentActions
    from .queryset import PriceComponentManager
    from .validators import PriceComponentValidator


__all__ = [
    "PriceComponent",
]


class PriceComponent(models.Model):
    pricing_group: PricingGroup = models.ForeignKey(
        "tilavarauspalvelu.PricingGroup",
        related_name="components",
        on_delete=models.CASCADE,
    )
    kind: PriceComponentKind = TextChoicesField(enum=PriceComponentKind, default=PriceComponentKind.BASE)

    valid_from: datetime.date = models.DateField()
    valid_until: datetime.date | None = models.DateField(null=True, blank=True)  # Exclusive

    # Null means that the component applies to every price option.
    price_option: PriceOption | None = models.ForeignKey(
        "tilavarauspalvelu.PriceOption",
        related_name="price_components",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    # Gross amount, VAT included
    amount: Decimal = models.DecimalField(max_digits=10, decimal_places=2)
    price_unit: PriceUnit = TextChoicesField(enum=PriceUnit)

    can_apply_for_discount: bool = models.BooleanField(default=False)

    material_price_description: str = Nh3CharField(
        blank=True,
        default="",
        max_length=1000,  # Double of the limit of 500 chars in order to accommodate HTML tags
        allowed_tags=settings.NH3_ALLOWED_TAGS,
        allowed_attributes=settings.NH3_ALLOWED_ATTRIBUTES,
    )

    payment_type: PaymentType | None = TextChoicesField(enum=PaymentType, null=True, blank=True)

    # Translated field hints
    material_price_description_fi: str | None
    material_price_description_en: str | None
    material_price_description_sv: str | None

    objects: ClassVar[PriceComponentManager] = LazyModelManager.new()
    actions: LazyAttribute[PriceComponentActions] = LazyModelAttribute.new()
    validators: LazyAttribute[PriceComponentValidator] = LazyModelAttribute.new()

    class Meta:
        db_table = "price_component"
        base_manager_name = "objects"
        verbose_name = _("price component")
        verbose_name_plural = _("price components")
        ordering = ["pricing_group", "valid_from", "pk"]
        constraints = [
            models.CheckConstraint(
                name="price_component_amount_not_negative",
                condition=models.Q(amount__gte=0),
                violation_error_message="Amount cannot be negative.",
                violation_error_code=error_codes.PRICE_COMPONENT_AMOUNT_NEGATIVE,
            ),
            models.CheckConstraint(
                name="price_component_payment_type_only_when_paid",
                condition=(
                    models.Q(amount__gt=0, payment_type__isnull=False) | models.Q(amount=0, payment_type__isnull=True)
                ),
                violation_error_message="Payment type is required for a paid component and not allowed for a free one.",
                violation_error_code=error_codes.PRICE_COMPONENT_PAYMENT_TYPE_INVALID,
            ),
            models.CheckConstraint(
                name="price_component_valid_from_before_valid_until",
                condition=models.Q(valid_until__isnull=True) | models.Q(valid_from__lt=models.F("valid_until")),
                violation_error_message="Valid from must be before valid until.",
                violation_error_code=error_codes.PRICE_COMPONENT_VALID_UNTIL_NOT_AFTER_VALID_FROM,
            ),
        ]

    def __str__(self) -> str:
        return f"{self.kind} {self.amount} {self.price_unit} from {self.valid_from}"


AuditLogger.register(PriceComponent)
