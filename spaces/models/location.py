from typing import TYPE_CHECKING, Optional

from django.contrib.gis.db.models import PointField
from django.contrib.gis.geos import Point
from django.db import models

if TYPE_CHECKING:
    from spaces.models import Building, RealEstate, Space, Unit

__all__ = [
    "Location",
]

# SRID 4326 - Spatial Reference System Identifier number 4326.
# EPSG:4326 - It's the same thing, but EPSG is the name of the authority maintaining an SRID reference.
# WGS 84 - World Geodetic System from 1984. It's the coordinate system used in GPS.
#
# 4326 is the identifier number (SRID) for WGS 84 in the EPSG reference.
# So in summary SRID 4326 == EPSG:4326 == WGS 84 == "GPS coordinates".
#
# The coordinates in this coordinate system are numbers in the range of
# -90.0000 to 90.0000 for latitude and -180.0000 to 180.0000 for longitude.
COORDINATE_SYSTEM_ID: int = 4326


class Location(models.Model):
    """
    Location is used for classes needing for location data. e.g. address or coordinates.
    Relations are defined in OneToOne relations and can be added when needed.
    """

    address_street: str = models.CharField(max_length=100, blank=True)
    address_zip: str = models.CharField(max_length=30, blank=True)
    address_city: str = models.CharField(max_length=100, blank=True)
    space: Optional["Space"] = models.OneToOneField(
        "spaces.Space",
        related_name="location",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    building: Optional["Building"] = models.OneToOneField(
        "spaces.Building",
        related_name="location",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    real_estate: Optional["RealEstate"] = models.OneToOneField(
        "spaces.RealEstate",
        related_name="location",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    unit: Optional["Unit"] = models.OneToOneField(
        "spaces.Unit",
        related_name="location",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    coordinates: Point | None = PointField(null=True, srid=COORDINATE_SYSTEM_ID)

    class Meta:
        db_table = "location"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self) -> str:
        return self.address

    @property
    def address(self) -> str:
        return f"{self.address_street}, {self.address_zip} {self.address_city}"

    @property
    def lat(self) -> float | None:
        return self.coordinates.y if self.coordinates else None

    @property
    def lon(self) -> float | None:
        return self.coordinates.x if self.coordinates else None
