from graphene.utils.str_converters import to_camel_case
from graphql import GraphQLError
from rest_framework import serializers
from rest_framework.exceptions import ErrorDetail


class PrimaryKeySerializerBase(serializers.ModelSerializer):
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


class PrimaryKeySerializer(PrimaryKeySerializerBase):
    pk = serializers.IntegerField(read_only=True)

    def get_pk(self, instance):
        return instance.id


class PrimaryKeyUpdateSerializer(PrimaryKeySerializerBase):
    pk = serializers.IntegerField(required=True)

    def get_pk(self, instance):
        return instance.id
