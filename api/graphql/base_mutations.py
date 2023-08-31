from enum import Enum
from typing import Any, Generic, Literal, Self, TypeVar

import graphene
from django.core.exceptions import ValidationError
from django.db.models import Model
from django.http import HttpRequest
from graphene import ClientIDMutation, Field, InputField
from graphene.types.utils import yank_fields_from_attrs
from graphene_django.rest_framework.mutation import SerializerMutationOptions, fields_for_serializer
from graphene_django.types import ErrorType
from graphene_permissions.mixins import AuthMutation
from graphql import GraphQLError
from rest_framework import serializers
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import get_object_or_404
from rest_framework.serializers import ModelSerializer, as_serializer_error
from rest_framework.settings import api_settings

from common.typing import GQLInfo

TModel = TypeVar("TModel", bound=Model)


class AuthSerializerMutation(AuthMutation):
    @classmethod
    def mutate_and_get_payload(cls, root, info, **input):
        if not cls.has_permission(root, info, input):
            raise PermissionDenied("No permission to mutate")

        return super().mutate_and_get_payload(root, info, **input)


class AuthDeleteMutation(AuthMutation):
    deleted = graphene.Boolean()
    errors = graphene.String()

    class Input:
        pk = graphene.Int(required=True)

    @classmethod
    def mutate_and_get_payload(cls, root, info, **input):
        if not cls.has_permission(root, info, input):
            raise GraphQLError("No permissions to perform delete.")

        try:
            if cls.is_valid(root, info, **input):
                object = get_object_or_404(cls.model, pk=input["pk"])
                object.delete()
                return cls(deleted=True)
        except ValidationError as ve:
            raise GraphQLError(ve.message)

        return cls(deleted=False)

    @classmethod
    def validate(self, root, info, **input):
        """Classes that ought to be overriding this method should raise django's
        ValidationError if there's some validation problem. It gets caught in
        `mutate_and_get_payload` method and returned as an error.
        """
        return None

    @classmethod
    def is_valid(cls, root, info, **input):
        errors = cls.validate(root, info, **input)
        is_valid = False if errors else True
        return is_valid


class BaseAuthMutation(AuthMutation):
    class Meta:
        abstract = True

    errors = graphene.List(ErrorType, description="May contain more than one error for same field.")

    @classmethod
    def mutate(cls, root: Any, info: GQLInfo, **kwargs: Any) -> Self:
        if not cls.has_permission(root, info, kwargs):
            detail = {api_settings.NON_FIELD_ERRORS_KEY: ["No permission to mutate."]}
            errors = ErrorType.from_errors(detail)
            return cls(errors=errors)

        try:
            return super().mutate(root, info, **kwargs)
        except (ValidationError, serializers.ValidationError) as error:
            detail = as_serializer_error(error)
            errors = ErrorType.from_errors(detail)
            return cls(errors=errors)


class ModelSerializerAuthMutation(BaseAuthMutation, ClientIDMutation):
    class Meta:
        abstract = True

    @classmethod
    def __init_subclass_with_meta__(
        cls,
        lookup_field: str | None = None,
        serializer_class: type[ModelSerializer] | None = None,
        model_operation: Literal["create", "update"] | None = None,
        **options: Any,
    ) -> None:
        if serializer_class is None:
            raise ValueError("Serializer class is required")

        if not issubclass(serializer_class, ModelSerializer):
            raise ValueError("Serializer class needs to be a ModelSerializer")

        if model_operation is None:
            raise ValueError("Model operation is required")

        serializer = serializer_class()
        model_class: type[Model] = serializer_class.Meta.model

        if lookup_field is None:
            lookup_field = model_class._meta.pk.name  # usually 'id'

        input_fields = fields_for_serializer(
            serializer,
            only_fields=(),
            exclude_fields=(),
            # This way none of the inputs are required in the update mutation.
            is_input=model_operation == "create",
            convert_choices_to_enum=True,
            lookup_field=lookup_field,
        )
        output_fields = fields_for_serializer(
            serializer,
            only_fields=(),
            exclude_fields=(),
            is_input=False,
            convert_choices_to_enum=True,
            lookup_field=lookup_field,
        )

        _meta = SerializerMutationOptions(cls)
        _meta.lookup_field = lookup_field
        _meta.serializer_class = serializer_class
        _meta.model_class = model_class
        _meta.fields = yank_fields_from_attrs(output_fields, _as=Field)
        input_fields = yank_fields_from_attrs(input_fields, _as=InputField)

        super().__init_subclass_with_meta__(_meta=_meta, input_fields=input_fields, **options)

    @classmethod
    def mutate_and_get_payload(cls, root: Any, info: GQLInfo, **kwargs: Any):
        kwargs = cls.get_serializer_kwargs(info.context, **kwargs)
        serializer = cls._meta.serializer_class(**kwargs)
        serializer.is_valid(raise_exception=True)
        obj = cls.perform_mutate(serializer)
        output = cls.to_representation(serializer, obj)
        return cls(errors=None, **output)

    @classmethod
    def get_serializer_kwargs(cls, request: HttpRequest, **kwargs) -> dict[str, Any]:
        for input_dict_key, maybe_enum in kwargs.items():
            if isinstance(maybe_enum, Enum):
                kwargs[input_dict_key] = maybe_enum.value

        instance = cls.get_instance(**kwargs)

        return {
            "instance": instance,
            "data": kwargs,
            "context": {"request": request},
            "partial": instance is not None,
        }

    @classmethod
    def get_instance(cls, **kwargs: Any) -> TModel | None:
        """Get the object to be updated or None if we're creating a new object.
        Should raise a serializers.ValidationError if the object does not exist."""
        return None

    @classmethod
    def perform_mutate(cls, obj: ModelSerializer) -> TModel:
        return obj.save()

    @classmethod
    def to_representation(cls, serializer: ModelSerializer, obj: TModel) -> dict[str, Any]:
        kwargs = {}
        for field_name, field in serializer.fields.items():
            if not field.write_only:
                if isinstance(field, serializers.SerializerMethodField):
                    kwargs[field_name] = field.to_representation(obj)
                else:
                    kwargs[field_name] = field.get_attribute(obj)
        return kwargs


class GetInstanceMixin:
    _meta: SerializerMutationOptions

    @classmethod
    def get_instance(cls, **kwargs: Any) -> TModel | None:
        lookup_field: str = cls._meta.lookup_field
        model_class: type[TModel] = cls._meta.model_class
        if lookup_field not in kwargs:
            raise serializers.ValidationError({lookup_field: "This field is required."})

        return cls.get_object(model_class, lookup_field, **kwargs)

    @classmethod
    def get_object(cls, model_class: type[TModel], lookup_field: str, **kwargs: Any) -> TModel:
        try:
            return model_class.objects.get(**{lookup_field: kwargs[lookup_field]})
        except model_class.DoesNotExist:
            raise serializers.ValidationError("Object does not exist.")


class ModelAuthMutation(BaseAuthMutation, ClientIDMutation, GetInstanceMixin):
    class Meta:
        abstract = True

    @classmethod
    def __init_subclass_with_meta__(
        cls,
        model: type[TModel] | None = None,
        lookup_field: str | None = None,
        **options: Any,
    ) -> None:
        if model is None:
            raise ValueError("Model is required.")

        if lookup_field is None:
            lookup_field = model._meta.pk.name  # usually 'id'

        # Override 'input_fields' in child '__init_subclass_with_meta__'
        # 'options' if 'lookup_field' is not compatible 'graphene.ID'.
        options.setdefault("input_fields", {lookup_field: graphene.ID(required=True)})

        _meta = SerializerMutationOptions(cls)  # used for convenience
        _meta.lookup_field = lookup_field
        _meta.model_class = model
        super().__init_subclass_with_meta__(_meta=_meta, **options)

    @classmethod
    def mutate_and_get_payload(cls, root: Any, info: GQLInfo, **kwargs: Any) -> Self:
        instance = cls.get_instance(**kwargs)
        cls.validate(instance, **kwargs)
        results = cls.perform_mutate(instance)
        return cls(errors=None, **results)

    @classmethod
    def validate(cls, instance: TModel, **kwargs: Any) -> None:
        """Implement to perform additional validation before object is mutated."""
        return None

    @classmethod
    def perform_mutate(cls, obj: TModel) -> dict[str, Any]:
        """Perform the mutation and return output data."""
        return {}


# This should replace 'AuthSerializerMutation' in the future
class CreateAuthMutation(ModelSerializerAuthMutation, Generic[TModel]):
    """Mutation class for creating a model instance.
    Should set the `serializer_class` attribute in the Meta class
    to a ModelSerializer class for the model to be created.
    """

    class Meta:
        abstract = True

    @classmethod
    def __init_subclass_with_meta__(cls, **options: Any) -> None:
        super().__init_subclass_with_meta__(model_operation="create", **options)


# This should replace 'AuthSerializerMutation' in the future
class UpdateAuthMutation(GetInstanceMixin, ModelSerializerAuthMutation, Generic[TModel]):
    """Mutation class for updating a model instance.
    Should set the `serializer_class` attribute in the Meta class
    to a ModelSerializer class for the model to be updated.
    Optionally, the `lookup_field` attribute can be set to specify which
    field to use for looking up the instance (defaults to the object's
    primary key, which is usually `id`). Note that the `lookup_field`
    attribute has to be available from the serializer's 'Meta.fields' definition!
    """

    class Meta:
        abstract = True

    @classmethod
    def __init_subclass_with_meta__(cls, **options: Any) -> None:
        super().__init_subclass_with_meta__(model_operation="update", **options)


# This should replace 'AuthDeleteMutation' in the future
class DeleteAuthMutation(ModelAuthMutation, Generic[TModel]):
    """Mutation class for deleting a model instance.
    Should set the `model` attribute in the Meta class
    to a model class for the model to be deleted.
    Optionally, the `lookup_field` attribute can be set to specify which
    field to use for looking up the instance (defaults to the object's
    primary key, which is usually `id`).
    """

    deleted = graphene.Boolean(default_value=False, description="Whether the object was deleted successfully.")
    row_count = graphene.Int(default_value=0, description="Number of rows deleted.")

    class Meta:
        abstract = True

    @classmethod
    def perform_mutate(cls, obj: TModel) -> dict[str, Any]:
        count, rows = obj.delete()
        row_count = rows.get(obj._meta.label, 0)
        return {"deleted": bool(count), "row_count": row_count}
