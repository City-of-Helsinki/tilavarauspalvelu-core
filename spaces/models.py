from django.db import models
from django.utils.translation import ugettext_lazy as _


class District(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)

    def __str__(self):
        return "{}".format(self.name)


class RealEstate(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    district = models.ForeignKey(
        District,
        verbose_name=_("District"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    area = models.DecimalField(
        verbose_name=_("Area"), max_digits=10, decimal_places=2, blank=True, null=True
    )

    def __str__(self):
        return "{}".format(self.name)


class Building(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    district = models.ForeignKey(
        District,
        verbose_name=_("District"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    real_estate = models.ForeignKey(
        RealEstate,
        verbose_name=_("Real estate"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    area = models.DecimalField(
        verbose_name=_("Area"), max_digits=10, decimal_places=2, blank=True, null=True
    )

    def __str__(self):
        return "{}".format(self.name)


class Space(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    parent = models.ForeignKey(
        "self",
        verbose_name=_("Parent space"),
        related_name="children",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    building = models.ForeignKey(
        Building,
        verbose_name=_("Building"),
        related_name="spaces",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    area = models.DecimalField(
        verbose_name=_("Area"), max_digits=10, decimal_places=2, blank=True, null=True
    )

    def __str__(self):
        return "{} ({})".format(self.name, self.building.name if self.building else "")
