from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _
from helsinki_gdpr.models import SerializableMixin

from .queryset import PersonManager

if TYPE_CHECKING:
    from .actions import PersonActions


__all__ = [
    "Person",
]


class Person(SerializableMixin, models.Model):
    first_name: str = models.CharField(max_length=50)
    last_name: str = models.CharField(max_length=50)
    email: str | None = models.EmailField(null=True, blank=True)
    phone_number: str | None = models.CharField(null=True, blank=True, max_length=50)

    objects = PersonManager()

    class Meta:
        db_table = "person"
        base_manager_name = "objects"
        verbose_name = _("person")
        verbose_name_plural = _("persons")
        ordering = ["pk"]

    # For GDPR API
    serialize_fields = (
        {"name": "first_name"},
        {"name": "last_name"},
        {"name": "email"},
        {"name": "phone_number"},
    )

    def __str__(self) -> str:
        return f"{self.first_name} {self.last_name}"

    @cached_property
    def actions(self) -> PersonActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import PersonActions

        return PersonActions(self)
