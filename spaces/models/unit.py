from django.conf import settings
from django.db import models

from spaces.querysets.unit import UnitQuerySet

__all__ = [
    "Unit",
    "UnitGroup",
]


class Unit(models.Model):
    """
    Model representation of Unit as in "office" or "premises" that could contain
    separate building etc.
    """

    tprek_id: str | None = models.CharField(max_length=255, unique=True, blank=True, null=True)
    tprek_department_id: str | None = models.CharField(max_length=255, blank=True, null=True)

    name: str = models.CharField(max_length=255)
    description: str = models.TextField(max_length=4000, blank=True, default="")
    short_description: str = models.CharField(max_length=255, blank=True, default="")
    web_page: str = models.URLField(max_length=255, blank=True, default="")
    email: str = models.EmailField(max_length=255, blank=True, default="")
    phone: str = models.CharField(max_length=255, blank=True, default="")

    rank: int | None = models.PositiveIntegerField(blank=True, null=True)  # Used for ordering

    origin_hauki_resource = models.ForeignKey(
        "opening_hours.OriginHaukiResource",
        related_name="units",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )
    payment_merchant = models.ForeignKey(
        "merchants.PaymentMerchant",
        related_name="units",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    payment_accounting = models.ForeignKey(
        "merchants.PaymentAccounting",
        related_name="units",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )

    objects = UnitQuerySet.as_manager()

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
        ordering = [
            "rank",
        ]

    def __str__(self) -> str:
        return self.name

    def save(self, *args, **kwargs) -> None:
        old_values = Unit.objects.filter(pk=self.pk).first()
        result = super().save(*args, **kwargs)

        # When merchant changes, update reservation_units that are using
        # the merchant information from the Unit. This will update their
        # product mapping.
        if settings.UPDATE_PRODUCT_MAPPING and (
            old_values is None or old_values.payment_merchant != self.payment_merchant
        ):
            from reservation_units.tasks import refresh_reservation_unit_product_mapping

            reservation_units = self.reservationunit_set.filter(payment_merchant__isnull=True).all()
            for runit in reservation_units:
                refresh_reservation_unit_product_mapping.delay(runit.pk)

        return result

    @property
    def hauki_department_id(self) -> str:
        return f"tprek:{self.tprek_department_id}"


class UnitGroup(models.Model):
    name: str = models.CharField(max_length=255)
    units = models.ManyToManyField("spaces.Unit", related_name="unit_groups")

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    class Meta:
        db_table = "unit_group"
        base_manager_name = "objects"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
