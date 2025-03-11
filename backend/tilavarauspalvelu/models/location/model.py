from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.contrib.gis.db.models import PointField
from django.db import models
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.constants import COORDINATE_SYSTEM_ID
from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from django.contrib.gis.geos import Point

    from tilavarauspalvelu.models import Space, Unit

    from .actions import LocationActions
    from .queryset import LocationManager
    from .validators import LocationValidator


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

    coordinates: Point | None = PointField(null=True, srid=COORDINATE_SYSTEM_ID)

    space: Space | None = models.OneToOneField(
        "tilavarauspalvelu.Space",
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

    # Translated field hints
    address_street_fi: str | None
    address_street_en: str | None
    address_street_sv: str | None
    address_city_fi: str | None
    address_city_en: str | None
    address_city_sv: str | None

    objects: ClassVar[LocationManager] = LazyModelManager.new()
    actions: LocationActions = LazyModelAttribute.new()
    validators: LocationValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "location"
        base_manager_name = "objects"
        verbose_name = _("location")
        verbose_name_plural = _("locations")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.address

    @property
    def address(self) -> str:
        return ", ".join([self.address_street, f"{self.address_zip} {self.address_city}".strip()])

    @property
    def lat(self) -> float | None:
        return self.coordinates.y if self.coordinates else None

    @property
    def lon(self) -> float | None:
        return self.coordinates.x if self.coordinates else None
