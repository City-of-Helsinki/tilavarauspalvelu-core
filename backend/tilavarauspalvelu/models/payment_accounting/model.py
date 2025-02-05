from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.validators import is_numeric, validate_accounting_project

from .queryset import PaymentAccountingManager

if TYPE_CHECKING:
    from .actions import PaymentAccountingActions


__all__ = [
    "PaymentAccounting",
]


class PaymentAccounting(models.Model):
    # Custom validation comes from requirements in SAP

    name: str = models.CharField(max_length=128)
    company_code: str = models.CharField(max_length=4, validators=[is_numeric])
    main_ledger_account: str = models.CharField(max_length=6, validators=[is_numeric])
    vat_code: str = models.CharField(max_length=2)
    internal_order: str = models.CharField(blank=True, default="", max_length=10, validators=[is_numeric])
    profit_center: str = models.CharField(blank=True, default="", max_length=7, validators=[is_numeric])
    project: str = models.CharField(
        blank=True,
        default="",
        max_length=16,
        validators=[validate_accounting_project, is_numeric],
    )
    operation_area: str = models.CharField(blank=True, default="", max_length=6, validators=[is_numeric])
    balance_profit_center: str = models.CharField(max_length=10)

    objects = PaymentAccountingManager()

    class Meta:
        db_table = "payment_accounting"
        base_manager_name = "objects"
        verbose_name = _("payment accounting")
        verbose_name_plural = _("payment accountings")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args: Any, **kwargs: Any) -> None:
        from tilavarauspalvelu.models import ReservationUnit
        from tilavarauspalvelu.tasks import refresh_reservation_unit_accounting

        super().save(*args, **kwargs)

        if settings.UPDATE_ACCOUNTING:
            reservation_units_from_units = ReservationUnit.objects.filter(unit__in=self.units.all())
            reservation_units = reservation_units_from_units.union(self.reservation_units.all())
            for reservation_unit in reservation_units:
                refresh_reservation_unit_accounting.delay(reservation_unit.pk)

    @cached_property
    def actions(self) -> PaymentAccountingActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import PaymentAccountingActions

        return PaymentAccountingActions(self)

    def clean(self) -> None:
        if not self.project and not self.profit_center and not self.internal_order:
            error_message = _("One of the following fields must be given: internal_order, profit_center, project")
            raise ValidationError({
                "internal_order": [error_message],
                "profit_center": [error_message],
                "project": [error_message],
            })
