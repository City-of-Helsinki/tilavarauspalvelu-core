from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _
from helsinki_gdpr.models import SerializableMixin

from .queryset import AddressManager

if TYPE_CHECKING:
    from .actions import AddressActions


__all__ = [
    "Address",
]


class Address(SerializableMixin, models.Model):
    street_address: str = models.TextField(max_length=80)
    post_code: str = models.CharField(max_length=32)
    city: str = models.TextField(max_length=80)

    # Translated field hints
    street_address_fi: str | None
    street_address_en: str | None
    street_address_sv: str | None
    city_fi: str | None
    city_en: str | None
    city_sv: str | None

    objects = AddressManager()

    class Meta:
        db_table = "address"
        base_manager_name = "objects"
        verbose_name = _("address")
        verbose_name_plural = _("addresses")
        ordering = ["pk"]

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
        return self.full_address

    @cached_property
    def actions(self) -> AddressActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import AddressActions

        return AddressActions(self)

    @property
    def full_address(self) -> str:
        return f"{self.street_address}, {self.post_code} {self.city}"
