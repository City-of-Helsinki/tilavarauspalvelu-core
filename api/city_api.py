from rest_framework import serializers, viewsets

from applications.models import City
from permissions.api_permissions.drf_permissions import CityPermission


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ["id", "name"]


class CityViewSet(viewsets.ModelViewSet):
    queryset = City.objects.all()
    serializer_class = CitySerializer
    permission_classes = [CityPermission]
