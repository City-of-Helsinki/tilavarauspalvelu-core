from django_filters import rest_framework as filters
from rest_framework import filters as drf_filters
from rest_framework import serializers, viewsets

from api.base import HierarchyModelMultipleChoiceFilter
from api.resources_api import ResourceSerializer
from api.services_api import ServiceSerializer
from api.space_api import SpaceSerializer
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
        ]


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
