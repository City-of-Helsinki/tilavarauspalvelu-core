from __future__ import annotations

from collections.abc import Callable
from functools import wraps
from itertools import chain
from typing import TYPE_CHECKING, Any, Literal, ParamSpec, Self, TypeVar

from django.contrib.auth.models import AnonymousUser
from django.db import models
from django.db.models.fields.related_descriptors import ManyToManyDescriptor, ReverseManyToOneDescriptor
from django.db.models.fields.reverse_related import ManyToManyRel, ManyToOneRel
from django.shortcuts import get_object_or_404
from rest_framework import serializers

from common.fields.model import IntChoiceField as IntChoiceModelField
from common.fields.serializer import IntChoiceField, IntegerPrimaryKeyField
from common.utils import get_field_to_related_field_mapping, get_translation_fields

if TYPE_CHECKING:
    from users.models import User

__all__ = [
    "TranslatedModelSerializer",
]


TModel = TypeVar("TModel", bound=models.Model)
P = ParamSpec("P")


def handle_related(func: Callable[P, TModel]) -> Callable[P, TModel]:
    """Handle related models before and after creating or updating the main model."""

    @wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> TModel:
        self: BaseModelSerializer = args[0]
        validated_data = next((arg for arg in args if isinstance(arg, dict)), kwargs.get("validated_data"))
        if validated_data is None:
            raise ValueError("'validated_data' not found in args or kwargs")

        related_serializers = self._prepare_related(validated_data)
        instance = func(*args, **kwargs)
        if related_serializers:
            self._handle_to_many(instance, related_serializers)
        return instance

    return wrapper


class BaseModelSerializer(serializers.ModelSerializer):
    """
    Base serializer for all models.
    Expects that models primary keys are integers.
    """

    instance: TModel  # use this to hint the instance model type in subclasses
    serializer_related_field = IntegerPrimaryKeyField
    serializer_field_mapping = serializers.ModelSerializer.serializer_field_mapping | {
        IntChoiceModelField: IntChoiceField,
    }

    class Meta:
        model: type[TModel]
        fields: list[str] | Literal["__all__"]

    def build_standard_field(
        self,
        field_name: str,
        model_field: models.Field,
    ) -> tuple[serializers.Field, dict[str, Any]]:
        field_class, field_kwargs = super().build_standard_field(field_name, model_field)
        if isinstance(model_field, IntChoiceModelField):
            field_kwargs["choices"] = model_field.enum.choices
        return field_class, field_kwargs

    def get_or_default(self, field: str, attrs: dict[str, Any]) -> Any:
        default = self.Meta.model._meta.get_field(field).default
        default = getattr(self.instance, field, default)
        return attrs.get(field, default)

    @property
    def request_user(self) -> User | AnonymousUser:
        return self.context["request"].user

    def get_update_or_create(self, data: dict[str, Any] | None) -> TModel | None:
        if data is None:
            return None

        pk = data.pop("pk", None)
        if pk is not None:
            instance = get_object_or_404(self.Meta.model, pk=pk)
            if not data:
                return instance
            return self.__class__().update(instance, data)

        return self.__class__().create(data)

    @handle_related
    def create(self, validated_data: dict[str, Any]) -> TModel:
        """Create a new instance of the model, while also handling related models."""
        return self.Meta.model._default_manager.create(**validated_data)

    @handle_related
    def update(self, instance: TModel, validated_data: dict[str, Any]) -> TModel:
        """Update an existing instance of the model, while also handling related models."""
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance

    def _prepare_related(self, validated_data: dict[str, Any]) -> dict[str, serializers.ListSerializer]:
        """
        Prepare related models defined using BaseModelSerializers.
        'to_one' related entities will be updated or created.
        'to_many' related entities are removed from 'validated_data'
        to be handled after the main model is saved using '_handle_to_many'.
        """
        related_serializers: dict[str, serializers.ListSerializer] = {}

        for name, _value in validated_data.copy().items():
            field: serializers.Field | None = self.fields.get(name, None)
            if field is None:
                continue

            # Update or create 'many_to_one' and 'one_to_one' relations
            if isinstance(field, BaseModelSerializer):
                validated_data[name] = field.get_update_or_create(validated_data.pop(name, None))

            # Separate 'one_to_many' and 'many_to_many' relations to be saved after
            elif isinstance(field, serializers.ListSerializer) and isinstance(field.child, BaseModelSerializer):
                field.initial_data = validated_data.pop(name, None)
                if field.initial_data is None:
                    continue

                related_serializers[name] = field

                # Determine if the related field is 'one_to_many' or 'many_to_many' related.
                # Used to determine if untouched related entities should be deleted in '_handle_to_many'.
                model_field: ReverseManyToOneDescriptor | ManyToManyDescriptor | None
                model_field = getattr(self.Meta.model, name, None)
                rel: ManyToOneRel | ManyToManyRel | None
                rel = getattr(model_field, "rel", None)
                field.context["one_to_many"] = getattr(rel, "one_to_many", False)
                field.context["many_to_many"] = getattr(rel, "many_to_many", False)

        return related_serializers

    def _handle_to_many(self, instance: TModel, related_serializers: dict[str, serializers.ListSerializer]) -> None:
        """
        Save related 'one_to_many' and 'many_to_many' models after the main model.
        Delete any existing 'one_to_many' entities that were untouched in this request.
        """
        field_name_mapping = get_field_to_related_field_mapping(self.Meta.model)
        for field_name, serializer in related_serializers.items():
            given_pks: list[Any] = []
            rel_name = field_name_mapping[field_name]
            child_serializer: BaseModelSerializer = serializer.child

            for item in serializer.initial_data:
                item[rel_name] = instance
                nested_instance = child_serializer.get_update_or_create(item)
                if nested_instance is not None:
                    given_pks.append(nested_instance.pk)

            # Delete 'one-to-many' related objects that were not created or modified.
            if serializer.context.get("one_to_many", False):
                child_serializer.Meta.model.objects.filter(**{rel_name: instance}).exclude(pk__in=given_pks).delete()


class TranslatedModelSerializer(BaseModelSerializer):
    """Adds all translatable fields specified in the 'Meta.fields' declaration to the serializer's fields."""

    def __new__(cls, *args: Any, **kwargs: Any) -> Self:
        if cls.Meta.fields != "__all__":
            translation_fields = get_translation_fields(cls.Meta.model, cls.Meta.fields)
            cls.Meta.fields = sorted(chain(cls.Meta.fields, translation_fields))
        return super().__new__(cls, *args, **kwargs)
