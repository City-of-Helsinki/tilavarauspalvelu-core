import graphene
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models import Model
from django.utils.deconstruct import deconstructible
from django.utils.translation import gettext_lazy as _
from graphene.utils.str_converters import to_camel_case
from graphene_django import DjangoObjectType
from graphene_permissions.mixins import AuthMutation
from graphql import GraphQLError
from modeltranslation.manager import get_translatable_fields_for_model
from rest_framework import serializers
from rest_framework.exceptions import ErrorDetail, PermissionDenied
from rest_framework.generics import get_object_or_404


class OldPrimaryKeySerializerBase(serializers.ModelSerializer):
    def _check_id_list(self, id_list, field_name):
        for identifier in id_list:
            try:
                int(identifier)
            except ValueError:
                raise GraphQLError(f"Wrong type of id: {identifier} for {field_name}")

    def to_internal_value(self, data):
        try:
            int_val = super().to_internal_value(data)
        except serializers.ValidationError as e:
            raise self.validation_error_to_graphql_error(e)

        return int_val

    def validation_error_to_graphql_error(self, e: serializers.ValidationError):
        fields = ["nonFieldError"]
        messages = []
        if isinstance(e.detail, dict) and len(e.detail.items()) > 0:
            fields = []
            for f, detail in e.detail.items():
                fields.append(to_camel_case(f))
                messages.append(" ".join(detail))

        elif isinstance(e.detail, list) and len(e.detail) > 0:
            for m in e.detail:
                messages.append(m)

        elif isinstance(e.detail, ErrorDetail):
            messages.append(e.detail)

        return GraphQLError(
            " ".join(messages),
            extensions={"field": ", ".join(fields)},
            original_error=e,
        )


class OldPrimaryKeySerializer(OldPrimaryKeySerializerBase):
    pk = serializers.IntegerField(read_only=True)

    def get_pk(self, instance):
        return instance.id


class OldPrimaryKeyUpdateSerializer(OldPrimaryKeySerializerBase):
    pk = serializers.IntegerField(required=True)

    def get_pk(self, instance):
        return instance.id


class OldAuthSerializerMutation(AuthMutation):
    @classmethod
    def mutate_and_get_payload(cls, root, info, **input):
        if not cls.has_permission(root, info, input):
            raise PermissionDenied("No permission to mutate")

        return super().mutate_and_get_payload(root, info, **input)


class OldAuthDeleteMutation(AuthMutation):
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
                obj = get_object_or_404(cls.model, pk=input["pk"])
                obj.delete()
                return cls(deleted=True)
        except ValidationError as ve:
            raise GraphQLError(ve.message)

        return cls(deleted=False)

    @classmethod
    def validate(cls, root, info, **input):
        """
        Classes that ought to be overriding this method should raise django's
        ValidationError if there's some validation problem. It gets caught in
        `mutate_and_get_payload` method and returned as an error.
        """
        return None

    @classmethod
    def is_valid(cls, root, info, **input):
        errors = cls.validate(root, info, **input)
        is_valid = not errors
        return is_valid


class OldPrimaryKeyObjectType(DjangoObjectType):
    pk = graphene.Int()

    class Meta:
        abstract = True

    def resolve_pk(self, info):
        return self.id


@deconstructible
class OldChoiceValidator:
    message = _('Choice "%(choice)s" is not allowed. Allowed choices are: %(allowed_choices)s.')
    code = "invalid_choice"

    def __init__(self, allowed_choices):
        if len(allowed_choices) > 0 and isinstance(allowed_choices[0][0], int):
            self.allowed_choices = [choice[0] for choice in allowed_choices]
        else:
            self.allowed_choices = [choice[0].upper() for choice in allowed_choices]

    def __call__(self, value):
        original_value = value
        if isinstance(value, str):
            value = value.upper()

        if value not in self.allowed_choices:
            raise ValidationError(
                self.message,
                self.code,
                {
                    "choice": original_value,
                    "allowed_choices": ", ".join(self.allowed_choices),
                },
            )


class OldChoiceCharField(serializers.CharField):
    def __init__(self, choices, **kwargs):
        super().__init__(**kwargs)
        choice_validator = OldChoiceValidator(choices)
        self.validators.append(choice_validator)

    def to_internal_value(self, data):
        if isinstance(data, str):
            data = data.lower()
        return super().to_internal_value(data)

    def get_attribute(self, instance):
        value = super().get_attribute(instance)
        if isinstance(value, str):
            return value.upper()
        return value


class OldChoiceIntegerField(serializers.IntegerField):
    choices = None

    def __init__(self, choices, **kwargs):
        super().__init__(**kwargs)
        choice_validator = OldChoiceValidator(choices)
        self.validators.append(choice_validator)


LANGUAGE_CODES = [x[0] for x in settings.LANGUAGES]


def get_all_translatable_fields(model: type[Model]) -> list[str]:
    fields = []

    translatable_fields = get_translatable_fields_for_model(model) or []

    for field in translatable_fields:
        for language in LANGUAGE_CODES:
            fields.append(f"{field}_{language}")
    return fields
