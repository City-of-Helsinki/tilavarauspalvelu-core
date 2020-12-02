from rest_framework import viewsets, serializers
from reservation_units.models import ReservationUnit, Purpose
from applications.models import ApplicationPeriod
from spaces.models import District
from api.space_api import SpaceSerializer
from api.resources_api import ResourceSerializer
from api.services_api import ServiceSerializer
from django_filters import rest_framework as filters
from rest_framework import filters as drf_filters
from api.base import HierarchyModelMultipleChoiceFilter


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


class ReservationUnitSerializer(serializers.ModelSerializer):
    spaces = SpaceSerializer(read_only=True, many=True)
    resources = ResourceSerializer(read_only=True, many=True)
    services = ServiceSerializer(read_only=True, many=True)

    class Meta:
        model = ReservationUnit
        fields = [
            "id",
            "name",
            "spaces",
            "resources",
            "services",
            "require_introduction",
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
