from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene.utils.str_converters import to_camel_case
from graphql import GraphQLError
from rest_framework import serializers
from rest_framework.exceptions import ErrorDetail

if TYPE_CHECKING:
    from django.db import models


class OldPrimaryKeySerializerBase(serializers.ModelSerializer):
    def _check_id_list(self, id_list, field_name) -> None:  # noqa: ANN001
        for identifier in id_list:
            try:
                int(identifier)
            except ValueError as err:
                msg = f"Wrong type of id: {identifier} for {field_name}"
                raise GraphQLError(msg) from err

    def to_internal_value(self, data: Any) -> Any:
        try:
            int_val = super().to_internal_value(data)
        except serializers.ValidationError as err:
            raise self.validation_error_to_graphql_error(err) from err

        return int_val

    def validation_error_to_graphql_error(self, error: serializers.ValidationError) -> GraphQLError:
        fields, message = self.compile_fields_and_errors(error.detail)
        return GraphQLError(message, extensions={"field": fields}, original_error=error)

    def compile_fields_and_errors(self, detail: list | dict | ErrorDetail) -> tuple[str, str]:
        fields: dict[str, None] = {"nonFieldError": None}  # dict used to maintain uniqueness and order
        message = self.compile_error_messages(detail, fields)
        return ", ".join(fields), message

    def compile_error_messages(self, detail: list | dict | ErrorDetail, fields: dict[str, None]) -> str:
        messages: list[str] = []

        if isinstance(detail, dict) and len(detail) > 0:
            fields.pop("nonFieldError", None)

            for field_name, field_details in detail.items():
                fields[to_camel_case(field_name)] = None
                for item in field_details:
                    message = self.compile_error_messages(item, fields)
                    messages.append(message)

        elif isinstance(detail, list) and len(detail) > 0:
            messages.extend(detail)

        elif isinstance(detail, ErrorDetail | str):
            messages.append(detail)

        return " ".join(messages)


class OldPrimaryKeySerializer(OldPrimaryKeySerializerBase):
    pk = serializers.IntegerField(read_only=True)

    def get_pk(self, instance: models.Model) -> int:
        return instance.id


class OldPrimaryKeyUpdateSerializer(OldPrimaryKeySerializerBase):
    pk = serializers.IntegerField(required=True)

    def get_pk(self, instance: models.Model) -> int:
        return instance.id
