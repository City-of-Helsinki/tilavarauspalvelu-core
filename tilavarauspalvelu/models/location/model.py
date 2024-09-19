from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.contrib.gis.db.models import PointField
from django.db import models

from tilavarauspalvelu.constants import COORDINATE_SYSTEM_ID

from .queryset import LocationManager

if TYPE_CHECKING:
    from django.contrib.gis.geos import Point

    from tilavarauspalvelu.models import Building, RealEstate, Space, Unit

    from .actions import LocationActions


__all__ = [
    "Location",
]


class Location(models.Model):
    """
    Location is used for classes needing for location data. e.g. address or coordinates.
    Relations are defined in OneToOne relations and can be added when needed.
    """

    address_street: str = models.CharField(max_length=100, blank=True)
    address_zip: str = models.CharField(max_length=30, blank=True)
    address_city: str = models.CharField(max_length=100, blank=True)
    space: Space | None = models.OneToOneField(
        "tilavarauspalvelu.Space",
        related_name="location",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    building: Building | None = models.OneToOneField(
        "tilavarauspalvelu.Building",
        related_name="location",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    real_estate: RealEstate | None = models.OneToOneField(
        "tilavarauspalvelu.RealEstate",
        related_name="location",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    unit: Unit | None = models.OneToOneField(
        "tilavarauspalvelu.Unit",
        related_name="location",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    coordinates: Point | None = PointField(null=True, srid=COORDINATE_SYSTEM_ID)

    objects = LocationManager()

    class Meta:
        db_table = "location"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.address

    @cached_property
    def actions(self) -> LocationActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import LocationActions

        return LocationActions(self)

    @property
    def address(self) -> str:
        return f"{self.address_street}, {self.address_zip} {self.address_city}"

    @property
    def lat(self) -> float | None:
        return self.coordinates.y if self.coordinates else None

    @property
    def lon(self) -> float | None:
        return self.coordinates.x if self.coordinates else None
