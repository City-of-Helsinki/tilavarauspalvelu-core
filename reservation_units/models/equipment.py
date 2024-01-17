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

    def __str__(self):
        return self.name
