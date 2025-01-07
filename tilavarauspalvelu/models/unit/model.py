from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import UnitManager

if TYPE_CHECKING:
    import datetime

    from .actions import UnitActions


__all__ = [
    "Unit",
]


class Unit(models.Model):
    """Model representation of Unit as in "office" or "premises" that could contain spaces."""

    rank: int = models.PositiveIntegerField(default=0, db_index=True)  # Used for ordering

    tprek_id: str | None = models.CharField(max_length=255, unique=True, blank=True, null=True)
    tprek_department_id: str | None = models.CharField(max_length=255, blank=True, null=True)
    tprek_last_modified: datetime.datetime | None = models.DateTimeField(blank=True, null=True)

    name: str = models.CharField(max_length=255)
    description: str = models.TextField(max_length=4000, blank=True, default="")
    short_description: str = models.CharField(max_length=255, blank=True, default="")
    web_page: str = models.URLField(max_length=255, blank=True, default="")
    email: str = models.EmailField(max_length=255, blank=True, default="")
    phone: str = models.CharField(max_length=255, blank=True, default="")

    search_terms = ArrayField(models.CharField(max_length=255), blank=True, default=list)

    origin_hauki_resource = models.ForeignKey(
        "tilavarauspalvelu.OriginHaukiResource",
        related_name="units",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    payment_merchant = models.ForeignKey(
        "tilavarauspalvelu.PaymentMerchant",
        related_name="units",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    payment_accounting = models.ForeignKey(
        "tilavarauspalvelu.PaymentAccounting",
        related_name="units",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    objects = UnitManager()

    name_fi: str | None
    name_en: str | None
    name_sv: str | None
    description_fi: str | None
    description_en: str | None
    description_sv: str | None
    short_description_fi: str | None
    short_description_en: str | None
    short_description_sv: str | None

    class Meta:
        db_table = "unit"
        base_manager_name = "objects"
        verbose_name = _("unit")
        verbose_name_plural = _("units")
        ordering = ["rank"]

    def __str__(self) -> str:
        return self.name

    def save(self, *args: Any, **kwargs: Any) -> None:
        old_values = Unit.objects.filter(pk=self.pk).first()
        result = super().save(*args, **kwargs)

        # When merchant changes, update reservation_units that are using
        # the merchant information from the Unit. This will update their
        # product mapping.
        if settings.UPDATE_PRODUCT_MAPPING and (
            old_values is None or old_values.payment_merchant != self.payment_merchant
        ):
            from tilavarauspalvelu.tasks import refresh_reservation_unit_product_mapping

            reservation_units = self.reservation_units.filter(payment_merchant__isnull=True).all()
            for runit in reservation_units:
                refresh_reservation_unit_product_mapping.delay(runit.pk)

        return result

    @cached_property
    def actions(self) -> UnitActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import UnitActions

        return UnitActions(self)

    @property
    def hauki_department_id(self) -> str:
        return f"tprek:{self.tprek_department_id}"
