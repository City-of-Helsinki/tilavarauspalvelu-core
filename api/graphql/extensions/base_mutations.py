from collections.abc import Iterable
from copy import deepcopy
from enum import Enum
from typing import Any, Literal, Self, TypeVar

import graphene
from django.core.exceptions import ValidationError
from django.db.models import Model
from django.http import HttpRequest
from graphene import ClientIDMutation, Field, InputField
from graphene.types.utils import yank_fields_from_attrs
from graphene_django.rest_framework.mutation import SerializerMutationOptions, fields_for_serializer
from graphene_django.settings import graphene_settings
from graphene_django.types import ErrorType
from graphene_django.utils import camelize
from graphene_permissions.permissions import AllowAny, BasePermission
from rest_framework import serializers
from rest_framework.serializers import ListSerializer, ModelSerializer, as_serializer_error
from rest_framework.settings import api_settings

from api.graphql.extensions.base_types import DjangoAuthNode
from common.typing import GQLInfo

__all__ = [
    "CreateAuthMutation",
    "UpdateAuthMutation",
    "DeleteAuthMutation",
]


TModel = TypeVar("TModel", bound=Model)


class BaseAuthMutation:
    class Meta:
        abstract = True

    errors = graphene.List(ErrorType, description="May contain more than one error for same field.")

    @classmethod
    def has_permission(cls, root: Any, info: GQLInfo, input_data: dict[str, Any]) -> bool:
        return all(perm.has_mutation_permission(root, info, input_data) for perm in cls._meta.permission_classes)

    @classmethod
    def mutate(cls, root: Any, info: GQLInfo, **kwargs: Any) -> Self:
        if not cls.has_permission(root=root, info=info, input_data=kwargs["input"]):
            detail = {api_settings.NON_FIELD_ERRORS_KEY: ["No permission to mutate."]}
            errors = ErrorType.from_errors(detail)
            return cls(errors=errors)

        try:
            # See `graphene.relay.mutation.ClientIDMutation.mutate`
            return super().mutate(root=root, info=info, input=kwargs["input"])
        except (ValidationError, serializers.ValidationError) as error:
            detail = as_serializer_error(error)
            detail = camelize(detail) if graphene_settings.CAMELCASE_ERRORS else detail
            detail = flatten_errors(detail)
            errors = [ErrorType(field=key, messages=value) for key, value in detail.items()]
            return cls(errors=errors)


def flatten_errors(errors: dict[str, Any]) -> dict[str, list[str]]:
    """
    Flatten nested errors dict to a single level. E.g.

    {"billing_address": {"city": ["msg1"], "post_code": ["msg2"]}}
    -> {"billing_address.city": ["msg"], "billing_address.post_code": ["msg2"]}
    """
    flattened_errors: dict[str, list[str]] = {}
    for field, error in errors.items():
        if isinstance(error, dict):
            for inner_field, inner_error in flatten_errors(error).items():
                flattened_errors[f"{field}.{inner_field}"] = inner_error
        else:
            flattened_errors[field] = error

    return flattened_errors


class GetInstanceMixin:
    """Mixin class that provides a `get_instance` method for retrieving the object to be mutated."""

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


class ModelSerializerAuthMutation(BaseAuthMutation, ClientIDMutation):
    """
    Base mutation class for create and update operations.

    Options are set in Meta-class:

    ```
    class Mutation(CreateMutation):
        class Meta:
            serializer_class = MySerializer
    ```

    `serializer_class` attribute is required, and should be set to a
    ModelSerializer class for the model to be created/updated.

    Optionally, the `permission_classes` attribute can be set to specify
    which permissions are required to mutate the object (defaults to AllowAny).

    Optionally for update, the `lookup_field` attribute can be set to specify which
    field to use for looking up the instance (defaults to the object's
    primary key, which is usually `id`). Note that the `lookup_field`
    attribute has to be available from the serializer's 'Meta.fields' definition!

    Optionally, the `output_serializer_class` attribute can be set to specify
    a different serializer class for the output data (defaults to the same
    serializer class as for the input data, which is modified so that all
    fields are non-required, enabling partial updates).

    Optionally, the `node` attribute must be set if the serializer contains a nested
    ModelSerializer (or a ListSerializer containing a ModelSerializer) as a field.
    (see. `api.graphql.extensions.base_mutations.ModelSerializerAuthMutation._check_for_node`)
    """

    class Meta:
        abstract = True

    @classmethod
    def __init_subclass_with_meta__(
        cls,
        lookup_field: str | None = None,
        node: type[DjangoAuthNode] | None = None,
        serializer_class: type[ModelSerializer] | None = None,
        output_serializer_class: type[ModelSerializer] | None = None,
        permission_classes: Iterable[type[BasePermission]] = (AllowAny,),
        model_operation: Literal["create", "update"] | None = None,
        **options: Any,
    ) -> None:
        if serializer_class is None:
            raise ValueError("Serializer class is required")

        if not issubclass(serializer_class, ModelSerializer):
            raise ValueError("Serializer class needs to be a ModelSerializer")

        if model_operation is None:
            raise ValueError("Model operation is required")

        serializer = output_serializer = serializer_class()
        if output_serializer_class is not None:
            output_serializer = output_serializer_class()

        cls._check_for_node(node, output_serializer)

        model_class: type[Model] = serializer_class.Meta.model
        lookup_field = cls._get_lookup_field(lookup_field, model_class)

        output_fields = fields_for_serializer(
            output_serializer,
            only_fields=(),
            exclude_fields=(),
            is_input=False,
            convert_choices_to_enum=True,
            lookup_field=lookup_field,
        )

        # Convert all fields to not required for update mutation input
        if model_operation == "update":
            serializer_class = cls._serializer_to_not_required(serializer, lookup_field, top_level=True)
            serializer = serializer_class()

        input_fields = fields_for_serializer(
            serializer,
            only_fields=(),
            exclude_fields=(),
            is_input=True,
            convert_choices_to_enum=True,
            lookup_field=lookup_field,
        )

        _meta = SerializerMutationOptions(cls)
        _meta.lookup_field = lookup_field
        _meta.serializer_class = serializer_class
        _meta.permission_classes = permission_classes
        _meta.model_class = model_class
        _meta.fields = yank_fields_from_attrs(output_fields, _as=Field)
        input_fields = yank_fields_from_attrs(input_fields, _as=InputField)

        super().__init_subclass_with_meta__(_meta=_meta, input_fields=input_fields, **options)

    @classmethod
    def _get_lookup_field(cls, lookup_field: str | None, model_class: type[Model]) -> str:
        if lookup_field is None:
            # Use model primary key as lookup field.
            # This is usually the 'id' field, in which case we use 'pk' instead
            # to avoid collision with the 'id' field in GraphQL Relay nodes.
            lookup_field = model_class._meta.pk.name
            if lookup_field == "id":
                lookup_field = "pk"
        return lookup_field

    @classmethod
    def _serializer_to_not_required(
        cls,
        serializer: ModelSerializer,
        lookup_field: str | None,
        *,
        top_level: bool = False,
    ) -> type[ModelSerializer] | type[ListSerializer]:
        """
        When updating, usually the wanted behaviour is that the user can only update the
        fields that are actually updated. Therefore, this method is used to create a new
        serializer which has all the appropriate fields set to `required=False` (except
        the top-level `lookup_field`, which is required to select the row to be updated).
        This method is recursive, so that nested serializers and their fields are also converted
        to `required=False`.

        :param serializer: The serializer to convert.
        :param lookup_field: The lookup field to be used for the update operation.
        :param top_level: Whether this is the top-level serializer.
        """
        # We need to create a new serializer and rename it since
        # `graphene_django.rest_framework.serializer_converter.convert_serializer_to_input_type`.
        # caches its results by the serializer class name, and thus the input type created for
        # the CREATE operation would be used if created first.
        new_class: type[ModelSerializer]
        new_class = type(f"Update{serializer.__class__.__name__}", (serializer.__class__,), {})  # type: ignore

        # Create a new Meta and deepcopy `extra_kwargs` to avoid changing the original serializer,
        # which might be used for other operations.
        new_class.Meta = type("Meta", (serializer.Meta,), {})  # type: ignore
        new_class.Meta.extra_kwargs = deepcopy(getattr(serializer.Meta, "extra_kwargs", {}))

        lookup_field = cls._get_lookup_field(lookup_field, new_class.Meta.model)

        for field_name in new_class.Meta.fields:
            # If the field is for a model property, it's `read_only=True`,
            # and should NOT be marked as `required=True`
            # (see `rest_framework.fields.Field.__init__`)
            # Lookup fields they have special handling.
            attr = getattr(new_class.Meta.model, field_name, None)
            if isinstance(attr, property) and field_name != lookup_field:
                continue

            cls._set_not_required(field_name, new_class.Meta, lookup_field=lookup_field, top_level=top_level)

        # Handle nested serializers
        for field_name, field in new_class._declared_fields.items():
            if isinstance(field, ModelSerializer):
                new_field = cls._serializer_to_not_required(field, None)
                new_kwargs = field._kwargs | {"required": False}
                new_class._declared_fields[field_name] = new_field(*field._args, **new_kwargs)

            elif isinstance(field, ListSerializer) and isinstance(field.child, ModelSerializer):
                new_child = cls._serializer_to_not_required(field.child, None)
                new_kwargs = field.child._kwargs | {"required": False, "many": True}
                new_class._declared_fields[field_name] = new_child(*field.child._args, **new_kwargs)

        return new_class

    @classmethod
    def _set_not_required(
        cls,
        field_name: str,
        meta: type,
        *,
        lookup_field: str,
        top_level: bool,
    ) -> None:
        """
        Set the required property for `field` in the given `meta` (`serializer_class.Meta`).
        If the field is the lookup field on the top-level serializer, it should be required.
        If the field required state has been explicitly set in the serializer's `Meta.extra_kwargs`,
        it should be left as is. Otherwise, the field should not be required.
        """
        required = top_level and field_name == lookup_field

        field_options = meta.extra_kwargs.setdefault(field_name, {})
        if "required" not in field_options:
            field_options["required"] = required

        # Lookup field should be additionally marked as writeable so that
        # serializer doesn't remove it during validation.
        if field_name == lookup_field:
            meta.extra_kwargs.setdefault(field_name, {})["read_only"] = False

    @classmethod
    def _check_for_node(cls, node: type[DjangoAuthNode] | None, output_serializer: ModelSerializer) -> None:
        any_model_serializer_fields = any(
            True
            for field in output_serializer.fields.values()
            if isinstance(field, serializers.ModelSerializer)
            or (isinstance(field, serializers.ListSerializer) and isinstance(field.child, serializers.ModelSerializer))
        )
        if any_model_serializer_fields and node is None:
            msg = (
                "Should specify `node` in mutation `Meta` class if mutation (output) serializer "
                "contains a nested ModelSerializer (or a ListSerializer) as a field. "
                "This is to make sure that `graphene_django.registry.Registry` is populated "
                "with the ModelSerializer's GraphQL type. See: "
                "1) `graphene_django.types.DjangoObjectType.__init_subclass_with_meta__` "
                "2) `graphene_django.rest_framework.serializer_converter.convert_serializer_field`"
            )
            raise ValueError(msg)
        elif not any_model_serializer_fields and node is not None:
            msg = "Node defined unnecessarily for mutation."
            raise ValueError(msg)

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
        """Overridden by `GetInstanceMixin` for update."""
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


class ModelAuthMutation(BaseAuthMutation, ClientIDMutation, GetInstanceMixin):
    """
    Base mutation class for deleting a model instance.
    Adds a `validate` class-method for performing additional validation before deletion.

    Options are set in Meta-class:

    ```
    class Mutation(CreateMutation):
        class Meta:
            model = MyModel
    ```

    `model` attribute is required, and should be set to a
    Model class for the model to be deleted.

    Optionally, the `permission_classes` attribute can be set to specify
    which permissions are required to delete the object (defaults to AllowAny).

    Optionally, the `lookup_field` attribute can be set to specify which
    field to use for looking up the instance (defaults to the object's
    primary key, which is usually `id`).
    """

    class Meta:
        abstract = True

    @classmethod
    def __init_subclass_with_meta__(
        cls,
        model: type[TModel] | None = None,
        lookup_field: str | None = None,
        permission_classes: Iterable[type[BasePermission]] = (AllowAny,),
        **options: Any,
    ) -> None:
        if model is None:
            raise ValueError("Model is required.")

        if lookup_field is None:
            # Use model primary key as lookup field.
            # This is usually the 'id' field, in which case we use 'pk' instead
            # to avoid collision with the 'id' field in GraphQL Relay nodes.
            lookup_field = model._meta.pk.name
            if lookup_field == "id":
                lookup_field = "pk"

        # Override 'input_fields' in child '__init_subclass_with_meta__'
        # 'options' if 'lookup_field' is not compatible 'graphene.ID'.
        options.setdefault("input_fields", {lookup_field: graphene.ID(required=True)})

        _meta = SerializerMutationOptions(cls)  # used for convenience
        _meta.lookup_field = lookup_field
        _meta.permission_classes = permission_classes
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


class CreateAuthMutation(ModelSerializerAuthMutation):
    class Meta:
        abstract = True

    @classmethod
    def __init_subclass_with_meta__(cls, **options: Any) -> None:
        super().__init_subclass_with_meta__(model_operation="create", **options)


class UpdateAuthMutation(GetInstanceMixin, ModelSerializerAuthMutation):
    class Meta:
        abstract = True

    @classmethod
    def __init_subclass_with_meta__(cls, **options: Any) -> None:
        super().__init_subclass_with_meta__(model_operation="update", **options)


class DeleteAuthMutation(ModelAuthMutation):
    deleted = graphene.Boolean(default_value=False, description="Whether the object was deleted successfully.")
    row_count = graphene.Int(default_value=0, description="Number of rows deleted.")

    class Meta:
        abstract = True

    @classmethod
    def perform_mutate(cls, obj: TModel) -> dict[str, Any]:
        count, rows = obj.delete()
        row_count = rows.get(obj._meta.label, 0)
        return {"deleted": bool(count), "row_count": row_count}
