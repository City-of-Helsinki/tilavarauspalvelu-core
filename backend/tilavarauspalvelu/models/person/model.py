from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from helsinki_gdpr.models import SerializableMixin

from utils.utils import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from .actions import PersonActions
    from .queryset import PersonManager
    from .validators import PersonValidator


__all__ = [
    "Person",
]


class Person(SerializableMixin, models.Model):
    first_name: str = models.CharField(max_length=50)
    last_name: str = models.CharField(max_length=50)
    email: str | None = models.EmailField(null=True, blank=True)
    phone_number: str | None = models.CharField(null=True, blank=True, max_length=50)

    objects: ClassVar[PersonManager] = LazyModelManager.new()
    actions: PersonActions = LazyModelAttribute.new()
    validators: PersonValidator = LazyModelAttribute.new()

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
