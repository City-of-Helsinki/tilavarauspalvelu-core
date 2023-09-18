from django.conf import settings
from django.db import models
from django.db.models import Model
from modeltranslation.manager import get_translatable_fields_for_model

LANGUAGE_CODES = [x[0] for x in settings.LANGUAGES]


def get_all_translatable_fields(model: type[Model]) -> list[str]:
    fields = []

    translatable_fields = get_translatable_fields_for_model(model) or []

    for field in translatable_fields:
        for language in LANGUAGE_CODES:
            fields.append(f"{field}_{language}")
    return fields


def get_translatable_field(model: models.Model, field_name: str):
    fields = []

    translatable_fields = get_translatable_fields_for_model(model) or []

    if len(translatable_fields) == 0:
        raise AssertionError(f"{field_name} is not translatable for model {model}")
    for field in [f for f in translatable_fields if f == field_name]:
        for language in LANGUAGE_CODES:
            fields.append(f"{field}_{language}")
    return fields
