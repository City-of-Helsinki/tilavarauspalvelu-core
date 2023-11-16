from django.db import models
from helsinki_gdpr.models import SerializableMixin

__all__ = [
    "Address",
]


class Address(SerializableMixin, models.Model):
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

    def __str__(self):
        return f"{self.street_address}, {self.post_code}, {self.city}"
