from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.db.models.functions import TruncDate
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager
from lookup_property import lookup_property

from utils.auditlog_util import AuditLogger
from utils.date_utils import DEFAULT_TIMEZONE, local_date
from utils.db import Now

if TYPE_CHECKING:
    from decimal import Decimal

    from lazy_managers import LazyAttribute

    from tilavarauspalvelu.models import PriceComponent, ReservationUnitPricing, TaxLevelRate
    from tilavarauspalvelu.models._base import OneToManyRelatedManager
    from tilavarauspalvelu.models.price_component.queryset import PriceComponentQuerySet
    from tilavarauspalvelu.models.reservation_unit_pricing.queryset import ReservationUnitPricingQuerySet
    from tilavarauspalvelu.models.tax_level_rate.queryset import TaxLevelRateQuerySet

    from .actions import TaxLevelActions
    from .queryset import TaxLevelManager
    from .validators import TaxLevelValidator

__all__ = [
    "TaxLevel",
]


class TaxLevel(models.Model):
    name: str = models.CharField(max_length=255, unique=True)

    # Translated field hints
    name_fi: str | None
    name_en: str | None
    name_sv: str | None

    objects: ClassVar[TaxLevelManager] = LazyModelManager.new()
    actions: LazyAttribute[TaxLevelActions] = LazyModelAttribute.new()
    validators: LazyAttribute[TaxLevelValidator] = LazyModelAttribute.new()

    rates: OneToManyRelatedManager[TaxLevelRate, TaxLevelRateQuerySet]
    reservation_unit_pricings: OneToManyRelatedManager[ReservationUnitPricing, ReservationUnitPricingQuerySet]
    price_components: OneToManyRelatedManager[PriceComponent, PriceComponentQuerySet]

    class Meta:
        db_table = "tax_level"
        base_manager_name = "objects"
        verbose_name = _("tax level")
        verbose_name_plural = _("tax levels")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    @lookup_property
    def current_percentage() -> Decimal | None:
        """The tax percentage of the rate that is in effect today."""
        from tilavarauspalvelu.models import TaxLevelRate

        # Lookup properties build this expression once per process, so the date must come from the database.
        today = TruncDate(Now(), tzinfo=DEFAULT_TIMEZONE)

        return models.Subquery(  # type: ignore[return-value]
            queryset=(
                TaxLevelRate.objects
                .filter(tax_level=models.OuterRef("pk"), begins__lte=today)
                .order_by("-begins")
                .values("percentage")[:1]
            ),
            output_field=models.DecimalField(max_digits=5, decimal_places=2, null=True),
        )

    @current_percentage.override
    def _(self) -> Decimal | None:
        today = local_date()
        return self.rates.effective_on(on_date=today).values_list("percentage", flat=True).first()


AuditLogger.register(TaxLevel)
