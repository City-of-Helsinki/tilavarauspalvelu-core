from itertools import chain
from typing import Any

from django.conf import settings
from django.db.models import Model
from modeltranslation.manager import get_translatable_fields_for_model
from rest_framework import serializers

__all__ = [
    "TranslatedModelSerializer",
    "get_translatable_fields_from_meta",
]


class BaseModelSerializer(serializers.ModelSerializer):
    def get_or_default(self, field: str, attrs: dict[str, Any]) -> Any:
        default = self.Meta.model._meta.get_field(field).default
        default = getattr(self.instance, field, default)
        return attrs.get(field, default)


class TranslatedModelSerializer(BaseModelSerializer):
    """Adds all translatable fields specified in the 'Meta.fields' declaration to the serializer's fields."""

    def __new__(cls, *args: Any, **kwargs: Any) -> Model:
        if cls.Meta.fields != "__all__":
            translatable_fields = get_translatable_fields_from_meta(cls.Meta)
            cls.Meta.fields = sorted(chain(cls.Meta.fields, translatable_fields))
        return super().__new__(cls, *args, **kwargs)


def get_translatable_fields_from_meta(meta) -> list[str]:
    translatable_fields = get_translatable_fields_for_model(meta.model) or []
    return [
        f"{field}_{language}"
        for field in translatable_fields
        for language, _ in settings.LANGUAGES
        if field in meta.fields
    ]
