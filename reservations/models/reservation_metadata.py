from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "ReservationMetadataField",
    "ReservationMetadataSet",
]


class ReservationMetadataField(models.Model):
    field_name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = "reservation_metadata_field"
        base_manager_name = "objects"
        verbose_name = _("Reservation metadata field")
        verbose_name_plural = _("Reservation metadata fields")

    def __str__(self) -> str:
        return self.field_name


class ReservationMetadataSet(models.Model):
    name = models.CharField(max_length=100, unique=True)

    supported_fields = models.ManyToManyField(
        "reservations.ReservationMetadataField",
        related_name="metadata_sets_supported",
    )
    required_fields = models.ManyToManyField(
        "reservations.ReservationMetadataField",
        related_name="metadata_sets_required",
        blank=True,
    )

    class Meta:
        db_table = "reservation_metadata_set"
        base_manager_name = "objects"
        verbose_name = _("Reservation metadata set")
        verbose_name_plural = _("Reservation metadata sets")

    def __str__(self) -> str:
        return self.name
