from rest_framework import serializers


class PrimaryKeySerializerBase(serializers.ModelSerializer):
    def _check_id_list(self, id_list, field_name):
        for identifier in id_list:
            try:
                int(identifier)
            except ValueError:
                raise serializers.ValidationError(
                    f"Wrong type of id: {identifier} for {field_name}"
                )


class PrimaryKeySerializer(PrimaryKeySerializerBase):
    pk = serializers.IntegerField(read_only=True)

    def get_pk(self, instance):
        return instance.id


class PrimaryKeyUpdateSerializer(PrimaryKeySerializerBase):
    pk = serializers.IntegerField(required=True)

    def get_pk(self, instance):
        return instance.id
