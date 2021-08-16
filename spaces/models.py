from django.contrib.gis.db.models import PointField
from django.db import models
from django.utils.translation import gettext_lazy as _
from mptt.models import MPTTModel, TreeForeignKey

# SRID 4326 - Spatial Reference System Identifier number 4326.
# EPSG:4326 - It's the same thing, but EPSG is the name of the authority maintaining an SRID reference.
# WGS 84 - World Geodetic System from 1984. It's the coordinate system used in GPS.
#
# 4326 is the identifier number (SRID) for WGS 84 in the EPSG reference.
# So in summary SRID 4326 == EPSG:4326 == WGS 84 == "GPS coordinates".
#
# The coordinates in this coordinate system are numbers in the range of
# -90.0000 to 90.0000 for latitude and -180.0000 to 180.0000 for longitude.
COORDINATE_SYSTEM_ID = 4326


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


class ServiceSector(models.Model):
    """
    Model representation of Service Sector that contains and manages
    units and application periods.
    """

    name = models.CharField(verbose_name=_("Name"), max_length=255)
    units = models.ManyToManyField(
        "Unit", verbose_name=_("Units"), related_name="service_sectors"
    )
    purposes = models.ManyToManyField(
        "reservation_units.Purpose",
        verbose_name=_("Purposes"),
        related_name="service_sectors",
    )

    def __str__(self):
        return self.name


class UnitGroup(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    units = models.ManyToManyField("Unit", related_name="unit_groups")


class Unit(models.Model):
    """
    Model representation of Unit as in "office" or "premises" that could contain
    separate building etc.
    """

    tprek_id = models.CharField(
        verbose_name=_("TPREK id"),
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

    def __str__(self):
        return self.name


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
    unit = models.ForeignKey(
        Unit,
        verbose_name=_("Unit"),
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
    """
    Location is used for classes needing for location data. E.g address or coordinates.
    Relations are defined in OneToOne relations and can be added when needed.
    """

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
        srid=COORDINATE_SYSTEM_ID,
    )

    @property
    def lat(self):
        return self.coordinates.y if self.coordinates else None

    @property
    def lon(self):
        return self.coordinates.x if self.coordinates else None

    def __str__(self):
        return "{}, {} {}".format(
            self.address_street, self.address_city, self.address_zip
        )
