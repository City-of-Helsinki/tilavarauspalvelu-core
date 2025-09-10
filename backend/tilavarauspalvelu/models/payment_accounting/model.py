from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.core.validators import MinLengthValidator
from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

from tilavarauspalvelu.validators import is_numeric, validate_accounting_project

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit, Unit
    from tilavarauspalvelu.models._base import OneToManyRelatedManager
    from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet
    from tilavarauspalvelu.models.unit.queryset import UnitQuerySet

    from .actions import PaymentAccountingActions
    from .queryset import PaymentAccountingManager
    from .validators import PaymentAccountingValidator


__all__ = [
    "PaymentAccounting",
]


class PaymentAccounting(models.Model):
    # Custom validation comes from requirements in SAP

    name: str = models.CharField(max_length=128)
    company_code: str = models.CharField(max_length=4, validators=[is_numeric])
    main_ledger_account: str = models.CharField(max_length=6, validators=[is_numeric])
    vat_code: str = models.CharField(max_length=2, validators=[MinLengthValidator(2)])

    internal_order: str = models.CharField(blank=True, default="", max_length=10, validators=[is_numeric])
    profit_center: str = models.CharField(blank=True, default="", max_length=7, validators=[is_numeric])
    project: str = models.CharField(
        blank=True,
        default="",
        max_length=16,
        validators=[validate_accounting_project, is_numeric],
    )

    operation_area: str = models.CharField(blank=True, default="", max_length=6, validators=[is_numeric])
    balance_profit_center: str = models.CharField(max_length=10, validators=[is_numeric])

    # Must be provided together or not at all
    product_invoicing_sales_org = models.CharField(
        max_length=4,
        blank=True,
        default="",
        validators=[MinLengthValidator(4), is_numeric],
    )
    product_invoicing_sales_office = models.CharField(
        max_length=4,
        blank=True,
        default="",
        validators=[MinLengthValidator(4), is_numeric],
    )
    product_invoicing_material = models.CharField(
        max_length=8,
        blank=True,
        default="",
        validators=[MinLengthValidator(8), is_numeric],
    )
    product_invoicing_order_type = models.CharField(
        max_length=4,
        blank=True,
        default="",
        validators=[MinLengthValidator(4)],
    )

    objects: ClassVar[PaymentAccountingManager] = LazyModelManager.new()
    actions: PaymentAccountingActions = LazyModelAttribute.new()
    validators: PaymentAccountingValidator = LazyModelAttribute.new()

    units: OneToManyRelatedManager[Unit, UnitQuerySet]
    reservation_units: OneToManyRelatedManager[ReservationUnit, ReservationUnitQuerySet]

    class Meta:
        db_table = "payment_accounting"
        base_manager_name = "objects"
        verbose_name = _("payment accounting")
        verbose_name_plural = _("payment accountings")
        ordering = ["pk"]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(
                        product_invoicing_sales_org="",
                        product_invoicing_sales_office="",
                        product_invoicing_material="",
                        product_invoicing_order_type="",
                    )
                    | models.Q(
                        ~models.Q(product_invoicing_sales_org=""),
                        ~models.Q(product_invoicing_sales_office=""),
                        ~models.Q(product_invoicing_material=""),
                        ~models.Q(product_invoicing_order_type=""),
                    )
                ),
                name="product_invoicing_data_together",
                violation_error_message="Must fill all product invoicing fields or none of them",
            ),
            models.CheckConstraint(
                check=~models.Q(project="") | ~models.Q(profit_center="") | ~models.Q(internal_order=""),
                name="internal_order_profit_center_or_project_required",
                violation_error_message=(
                    "At least one of the following fields must be filled: 'internal_order', 'profit_center', 'project'"
                ),
            ),
            models.CheckConstraint(
                check=models.Q(profit_center="") | models.Q(internal_order=""),
                name="either_internal_order_or_profit_center",
                violation_error_message="Can fill either 'internal_order' or 'profit_center'",
            ),
        ]

    def __str__(self) -> str:
        return self.name
