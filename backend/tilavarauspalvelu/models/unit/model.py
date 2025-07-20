from __future__ import annotations

from typing import TYPE_CHECKING, Any, ClassVar

from django.conf import settings
from django.contrib.gis.db.models import PointField
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

from tilavarauspalvelu.constants import COORDINATE_SYSTEM_ID

if TYPE_CHECKING:
    import datetime

    from django.contrib.gis.geos import Point

    from tilavarauspalvelu.models import ReservationUnit, Space, UnitGroup, UnitRole
    from tilavarauspalvelu.models._base import ManyToManyRelatedManager, OneToManyRelatedManager
    from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet
    from tilavarauspalvelu.models.space.queryset import SpaceQuerySet
    from tilavarauspalvelu.models.unit_group.queryset import UnitGroupQuerySet
    from tilavarauspalvelu.models.unit_role.queryset import UnitRoleQuerySet

    from .actions import UnitActions
    from .queryset import UnitManager
    from .validators import UnitValidator


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

    address_street: str = models.CharField(max_length=255, blank=True, default="")
    address_zip: str = models.CharField(max_length=255, blank=True, default="")
    address_city: str = models.CharField(max_length=255, blank=True, default="")

    coordinates: Point | None = PointField(null=True, blank=True, srid=COORDINATE_SYSTEM_ID)

    search_terms: list[str] = ArrayField(models.CharField(max_length=255), blank=True, default=list)

    allow_permissions_from_ad_groups: bool = models.BooleanField(default=False)

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
        blank=True,
        null=True,
    )
    payment_accounting = models.ForeignKey(
        "tilavarauspalvelu.PaymentAccounting",
        related_name="units",
        on_delete=models.PROTECT,
        blank=True,
        null=True,
    )

    # Translated field hints
    name_fi: str | None
    name_en: str | None
    name_sv: str | None
    description_fi: str | None
    description_en: str | None
    description_sv: str | None
    short_description_fi: str | None
    short_description_en: str | None
    short_description_sv: str | None
    address_street_fi: str | None
    address_street_en: str | None
    address_street_sv: str | None
    address_city_fi: str | None
    address_city_en: str | None
    address_city_sv: str | None

    objects: ClassVar[UnitManager] = LazyModelManager.new()
    actions: UnitActions = LazyModelAttribute.new()
    validators: UnitValidator = LazyModelAttribute.new()

    reservation_units: OneToManyRelatedManager[ReservationUnit, ReservationUnitQuerySet]
    spaces: OneToManyRelatedManager[Space, SpaceQuerySet]
    unit_groups: ManyToManyRelatedManager[UnitGroup, UnitGroupQuerySet]
    unit_roles: ManyToManyRelatedManager[UnitRole, UnitRoleQuerySet]

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
            from tilavarauspalvelu.tasks import refresh_reservation_unit_product_mapping_task

            reservation_units = self.reservation_units.filter(payment_merchant__isnull=True).all()
            for runit in reservation_units:
                refresh_reservation_unit_product_mapping_task.delay(runit.pk)

        return result

    @property
    def hauki_department_id(self) -> str:
        return f"tprek:{self.tprek_department_id}"

    @property
    def address(self) -> str:
        return ", ".join([self.address_street, f"{self.address_zip} {self.address_city}".strip()])

    @property
    def lat(self) -> float | None:
        return self.coordinates.y if self.coordinates else None

    @property
    def lon(self) -> float | None:
        return self.coordinates.x if self.coordinates else None
