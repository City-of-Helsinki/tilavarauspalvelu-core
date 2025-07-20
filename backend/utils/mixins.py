from __future__ import annotations

from typing import TYPE_CHECKING, Any

from helsinki_gdpr.models import SerializableMixin

if TYPE_CHECKING:
    from django.db import models

__all__ = [
    "SerializableModelManagerMixin",
    "SerializableModelMixin",
]


class SerializableModelManagerMixin:
    def serialize(self) -> list[dict[str, Any]]:
        return SerializableMixin.SerializableManager.serialize(self)  # type: ignore[arg-type]


class SerializableModelMixin:
    def serialize(self) -> list[dict[str, Any]]:
        return SerializableMixin.serialize(self)  # type: ignore[arg-type]

    def _resolve_field(self, model: type[models.Model], field_description: dict[str, Any]) -> Any:
        return SerializableMixin._resolve_field(self, model, field_description)  # type: ignore[arg-type]  # noqa: SLF001
