from django_filters import rest_framework as filters
from rest_framework import filters as drf_filters
from rest_framework import serializers, viewsets

from api.base import HierarchyModelMultipleChoiceFilter
from api.resources_api import ResourceSerializer
from api.services_api import ServiceSerializer
from api.space_api import LocationSerializer, SpaceSerializer
from applications.models import ApplicationPeriod
from reservation_units.models import Purpose, ReservationUnit, ReservationUnitImage
from spaces.models import District


class ReservationUnitFilter(filters.FilterSet):
    purpose = filters.ModelMultipleChoiceFilter(
        field_name="purposes", queryset=Purpose.objects.all()
    )
    application_period = filters.ModelMultipleChoiceFilter(
        field_name="application_periods", queryset=ApplicationPeriod.objects.all()
    )
    district = HierarchyModelMultipleChoiceFilter(
        field_name="spaces__district", queryset=District.objects.all()
    )
    max_persons = filters.NumberFilter(
        field_name="spaces__max_persons", lookup_expr="lte"
    )


class ReservationUnitImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReservationUnitImage
        fields = ["image_url", "image_type"]


class ReservationUnitSerializer(serializers.ModelSerializer):
    spaces = SpaceSerializer(read_only=True, many=True)
    resources = ResourceSerializer(read_only=True, many=True)
    services = ServiceSerializer(read_only=True, many=True)
    images = ReservationUnitImageSerializer(read_only=True, many=True)
    location = serializers.SerializerMethodField()
    max_persons = serializers.SerializerMethodField()

    class Meta:
        model = ReservationUnit
        fields = [
            "id",
            "name",
            "spaces",
            "resources",
            "services",
            "require_introduction",
            "images",
            "location",
            "max_persons",
        ]

    def get_location(self, reservation_unit):
        location = reservation_unit.get_location()
        if location:
            return LocationSerializer(location).data

        return None

    def get_max_persons(self, reservation_unit):
        return reservation_unit.get_max_persons()


class ReservationUnitViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationUnitSerializer
    filter_backends = [filters.DjangoFilterBackend, drf_filters.SearchFilter]
    filterset_class = ReservationUnitFilter
    search_fields = ["name"]

    def get_queryset(self):
        qs = ReservationUnit.objects.all().prefetch_related(
            "spaces", "resources", "services"
        )
        return qs


class PurposeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purpose
        fields = [
            "id",
            "name",
        ]


class PurposeViewSet(viewsets.ModelViewSet):
    serializer_class = PurposeSerializer
    queryset = Purpose.objects.all()
