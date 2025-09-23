from __future__ import annotations

from typing import TYPE_CHECKING, Any

import graphene
from graphene_django.converter import convert_django_field
from graphene_django.forms.converter import convert_form_field, get_form_field_description
from graphene_django.registry import Registry
from lookup_property.field import LookupPropertyField

from utils.fields.forms import TextChoicesFormField
from utils.fields.model import TextChoicesField

if TYPE_CHECKING:
    from django.db import models

    from tilavarauspalvelu.typing import GQLInfo


@convert_django_field.register(LookupPropertyField)
def _(field: LookupPropertyField, registry: Registry | None = None) -> graphene.Dynamic:
    model = field.model

    def dynamic_type() -> graphene.Field | None:
        _type = registry.get_type_for_model(model)
        if not _type:
            return None

        class CustomField(graphene.Field):
            def wrap_resolve(self, parent_resolver: Any) -> Any:  # noqa: ARG002
                def custom_resolver(root: models.Model, info: GQLInfo) -> Any:
                    return field.target_property.__get__(root, type(root))

                return custom_resolver

        return CustomField(_type, required=not field.null)

    return graphene.Dynamic(dynamic_type)


@convert_django_field.register(TextChoicesField)
def _(field: TextChoicesField, registry: Registry | None = None) -> graphene.Enum:  # noqa: ARG001
    return graphene.Enum.from_enum(field.enum)(
        description=get_form_field_description(field),
        required=not field.blank,
    )


@convert_form_field.register(TextChoicesFormField)
def _(field: TextChoicesFormField) -> graphene.Enum:
    return graphene.Enum.from_enum(field.enum)(
        description=get_form_field_description(field),
        required=field.required,
    )
