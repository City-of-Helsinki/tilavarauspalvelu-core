from rest_framework import serializers, viewsets
from resources.models import FixedResource, MovableResource


class FixedResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = FixedResource
        fields = ["pk", "name", "space", "buffer_time_before", "buffer_time_after"]


class MovableResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovableResource
        fields = ["pk", "name", "buffer_time_before", "buffer_time_after"]


class FixedResourceViewSet(viewsets.ModelViewSet):
    queryset = FixedResource.objects.all()
    serializer_class = FixedResourceSerializer


class MovableResourceViewSet(viewsets.ModelViewSet):
    queryset = MovableResource.objects.all()
    serializer_class = MovableResourceSerializer
