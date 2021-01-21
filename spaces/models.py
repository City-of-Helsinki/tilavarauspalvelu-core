from django.contrib.gis.db.models import PointField
from django.db import models
from django.utils.translation import gettext_lazy as _
from mptt.models import MPTTModel, TreeForeignKey


class District(MPTTModel):
    TYPE_MAJOR_DISTRICT = "major_district"
    TYPE_DISTRICT = "district"
    TYPE_SUB_DISTRICT = "sub_district"
    TYPE_NEIGHBORHOOD = "neighborhood"

    TYPE_CHOICES = (
        (TYPE_MAJOR_DISTRICT, _("Major district")),
        (TYPE_DISTRICT, _("District")),
        (TYPE_SUB_DISTRICT, _("Sub district")),
        (TYPE_NEIGHBORHOOD, _("Neighborhood")),
    )

    district_type = models.CharField(
        verbose_name=_("Type"),
        max_length=30,
        choices=TYPE_CHOICES,
        default=TYPE_DISTRICT,
    )
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    parent = TreeForeignKey(
        "self",
        verbose_name=_("Parent"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )

    def __str__(self):
        return "{} ({})".format(self.name, self.parent.name if self.parent else "")


class Unit(models.Model):
    """
    Model representation of Unit as in "office" or "premises" that could contain
    separate building etc.
    """

    service_map_id = models.CharField(
        verbose_name=_("Service map id"),
        max_length=255,
        unique=True,
        blank=True,
        null=True,  # If some units needs to be created manually.
    )
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    description = models.TextField(
        verbose_name=_("Description"), max_length=255, blank=True, default=""
    )
    short_description = models.CharField(
        verbose_name=_("Short description"), max_length=255, blank=True, default=""
    )
    web_page = models.URLField(
        verbose_name=_("Homepage for the unit"), max_length=255, blank=True, default=""
    )
    email = models.EmailField(verbose_name=_("Email"), blank=True, max_length=255)
    phone = models.CharField(verbose_name=_("Telephone"), blank=True, max_length=255)


class RealEstate(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    district = models.ForeignKey(
        District,
        verbose_name=_("District"),
        related_name="real_estates",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    surface_area = models.DecimalField(
        verbose_name=_("Surface area"),
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )

    def __str__(self):
        return "{}".format(self.name)


class Building(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    district = models.ForeignKey(
        District,
        verbose_name=_("District"),
        related_name="buildings",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    real_estate = models.ForeignKey(
        RealEstate,
        verbose_name=_("Real estate"),
        related_name="buildings",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )

    surface_area = models.DecimalField(
        verbose_name=_("Surface area"),
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )

    def __str__(self):
        return "{}".format(self.name)


class Space(MPTTModel):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    parent = TreeForeignKey(
        "self",
        verbose_name=_("Parent space"),
        related_name="children",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    district = models.ForeignKey(
        District,
        verbose_name=_("District"),
        related_name="spaces",
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
    surface_area = models.DecimalField(
        verbose_name=_("Surface area"),
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
    )
    max_persons = models.fields.PositiveIntegerField(
        verbose_name=_("Maximum number of persons"), null=True, blank=True
    )

    def __str__(self):
        return "{} ({})".format(self.name, self.building.name if self.building else "")


class Location(models.Model):
    address_street = models.CharField(
        verbose_name=_("Address street"), max_length=100, blank=True
    )
    address_zip = models.CharField(
        verbose_name=_("Address zip"), max_length=30, blank=True
    )
    address_city = models.CharField(
        verbose_name=_("Address city"), max_length=100, blank=True
    )
    space = models.OneToOneField(
        "Space",
        verbose_name=_("Space"),
        null=True,
        blank=True,
        related_name="location",
        on_delete=models.CASCADE,
    )
    building = models.OneToOneField(
        "Building",
        verbose_name=_("Building"),
        null=True,
        blank=True,
        related_name="location",
        on_delete=models.CASCADE,
    )
    real_estate = models.OneToOneField(
        "RealEstate",
        verbose_name=_("RealEstate"),
        null=True,
        blank=True,
        related_name="location",
        on_delete=models.CASCADE,
    )
    unit = models.OneToOneField(
        "Unit",
        verbose_name=_("Unit"),
        null=True,
        blank=True,
        related_name="location",
        on_delete=models.CASCADE,
    )
    coordinates = PointField(
        verbose_name=_("Coordinates"),
        null=True,
    )

    def __str__(self):
        return "{}, {} {}".format(
            self.address_street, self.address_city, self.address_zip
        )
