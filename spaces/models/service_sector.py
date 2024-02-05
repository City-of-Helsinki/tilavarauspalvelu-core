from django.db import models

__all__ = [
    "ServiceSector",
]


class ServiceSector(models.Model):
    """
    Model representation of Service Sector that contains and manages
    units and application periods.
    """

    name: str = models.CharField(max_length=255)
    units = models.ManyToManyField("spaces.Unit", related_name="service_sectors")

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    class Meta:
        db_table = "service_sector"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return self.name
