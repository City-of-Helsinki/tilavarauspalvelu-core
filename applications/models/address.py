from django.db import models
from django.utils.translation import gettext_lazy as _
from helsinki_gdpr.models import SerializableMixin

__all__ = [
    "Address",
]


class Address(SerializableMixin, models.Model):
    street_address = models.TextField(max_length=80, null=False, blank=False)
    post_code = models.CharField(max_length=32, null=False, blank=False)
    city = models.TextField(max_length=80, null=False, blank=False)

    # Translated field hints
    street_address_fi: str | None
    street_address_en: str | None
    street_address_sv: str | None
    city_fi: str | None
    city_en: str | None
    city_sv: str | None

    class Meta:
        db_table = "address"
        base_manager_name = "objects"
        verbose_name = _("Address")
        verbose_name_plural = _("Addresses")
        ordering = [
            "pk",
        ]

    # For GDPR API
    serialize_fields = (
        {"name": "post_code"},
        {"name": "street_address"},
        {"name": "street_address_fi"},
        {"name": "street_address_en"},
        {"name": "street_address_sv"},
        {"name": "city"},
        {"name": "city_fi"},
        {"name": "city_en"},
        {"name": "city_sv"},
    )

    def __str__(self) -> str:
        return f"{self.street_address}, {self.post_code}, {self.city}"
