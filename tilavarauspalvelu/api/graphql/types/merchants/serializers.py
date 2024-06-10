from rest_framework import serializers


class RefreshOrderInputSerializer(serializers.Serializer):
    order_uuid = serializers.UUIDField(required=True)


class RefreshOrderOutputSerializer(serializers.Serializer):
    order_uuid = serializers.UUIDField()
    status = serializers.CharField()
    reservation_pk = serializers.IntegerField()
