from django.conf import settings
from django.contrib.gis.db.models import PointField
from django.db import models
from django.utils.translation import gettext_lazy as _
from mptt.models import MPTTModel, TreeForeignKey

from merchants.models import PaymentAccounting, PaymentMerchant
from reservation_units.tasks import refresh_reservation_unit_product_mapping

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


class ServiceSector(models.Model):
    """
    Model representation of Service Sector that contains and manages
    units and application periods.
    """

    name = models.CharField(verbose_name=_("Name"), max_length=255)
    units = models.ManyToManyField(
        "Unit", verbose_name=_("Units"), related_name="service_sectors"
    )

    def __str__(self):
        return self.name


class UnitGroup(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    units = models.ManyToManyField("Unit", related_name="unit_groups")

    def __str__(self):
        return f"{self.name}"


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
    tprek_department_id = models.CharField(
        verbose_name=_("TPREK department id"), max_length=255, blank=True, null=True
    )
    name = models.CharField(verbose_name=_("Name"), max_length=255)
    description = models.TextField(
        verbose_name=_("Description"), max_length=4000, blank=True, default=""
    )
    short_description = models.CharField(
        verbose_name=_("Short description"), max_length=255, blank=True, default=""
    )
    web_page = models.URLField(
        verbose_name=_("Homepage for the unit"), max_length=255, blank=True, default=""
    )
    email = models.EmailField(verbose_name=_("Email"), blank=True, max_length=255)
    phone = models.CharField(verbose_name=_("Telephone"), blank=True, max_length=255)

    hauki_resource_id = models.CharField(
        verbose_name=_("Hauki resource id"), max_length=255, blank=True, null=True
    )
    rank = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_("Order number"),
        help_text=_("Order number to be use in api sorting."),
    )

    payment_merchant = models.ForeignKey(
        PaymentMerchant,
        verbose_name=_("Payment merchant"),
        related_name="units",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        help_text="Merchant used for payments",
    )

    payment_accounting = models.ForeignKey(
        PaymentAccounting,
        verbose_name=_("Payment accounting"),
        related_name="units",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        help_text="Payment accounting information",
    )

    class Meta:
        ordering = ["rank"]

    def __str__(self):
        return self.name

    @property
    def hauki_resource_origin_id(self):
        return self.tprek_id

    @property
    def hauki_resource_data_source_id(self):
        return "tprek"

    @property
    def hauki_department_id(self):
        return f"tprek:{self.tprek_department_id}"

    def save(self, *args, **kwargs):
        old_values = Unit.objects.filter(pk=self.pk).first()
        result = super(Unit, self).save(*args, **kwargs)

        # When merchant changes, update reservation_units that are using
        # the merchant information from the Unit. This will update their
        # product mapping.
        if settings.UPDATE_PRODUCT_MAPPING and (
            old_values is None or old_values.payment_merchant != self.payment_merchant
        ):
            reservation_units = self.reservationunit_set.filter(
                payment_merchant__isnull=True
            ).all()
            for runit in reservation_units:
                refresh_reservation_unit_product_mapping.delay(runit.pk)

        return result


class RealEstate(models.Model):
    name = models.CharField(verbose_name=_("Name"), max_length=255)

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
    code = models.CharField(
        verbose_name=_("Code for the space"),
        max_length=255,
        db_index=True,
        blank=True,
        default="",
    )

    def __str__(self):
        return "{} ({})".format(self.name, self.building.name if self.building else "")

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        tree_id = self.parent.tree_id if self.parent else self.tree_id
        self.__class__.objects.partial_rebuild(tree_id)


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
