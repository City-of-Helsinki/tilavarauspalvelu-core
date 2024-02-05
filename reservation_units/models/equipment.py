from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "Equipment",
    "EquipmentCategory",
]


class EquipmentCategory(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=200)
    rank = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_("Order number"),
        help_text=_("Order number to be used in api sorting."),
    )

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    class Meta:
        db_table = "equipment_category"
        base_manager_name = "objects"

    def __str__(self):
        return self.name


class Equipment(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=200)
    category = models.ForeignKey(
        EquipmentCategory,
        verbose_name=_("Category"),
        related_name="equipment",
        on_delete=models.CASCADE,
        null=False,
    )

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    class Meta:
        db_table = "equipment"
        base_manager_name = "objects"

    def __str__(self):
        return self.name
