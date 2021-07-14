from rest_framework import serializers


class PrimaryKeySerializer(serializers.ModelSerializer):
    pk = serializers.IntegerField(read_only=True)

    def get_pk(self, instance):
        return instance.id


class PrimaryKeyUpdateSerializer(serializers.ModelSerializer):
    pk = serializers.IntegerField(required=True)

    def get_pk(self, instance):
        return instance.id
