from dateutil.parser import parse
from django.conf import settings
from django.db.models import Sum
from django_filters import rest_framework as filters
from easy_thumbnails.files import get_thumbnailer
from rest_framework import filters as drf_filters
from rest_framework import mixins, permissions, serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from api.base import HierarchyModelMultipleChoiceFilter, TranslatedModelSerializer
from api.common_filters import NumberInFilter
from api.resources_api import ResourceSerializer
from api.services_api import ServiceSerializer
from api.space_api import BuildingSerializer, LocationSerializer, SpaceSerializer
from applications.models import ApplicationRound
from opening_hours.hours import HaukiRequestError
from opening_hours.utils import get_resources_total_hours_per_resource
from permissions.api_permissions import (
    EquipmentCategoryPermission,
    EquipmentPermission,
    PurposePermission,
    ReservationUnitPermission,
    ReservationUnitTypePermission,
)
from reservation_units.models import (
    Equipment,
    EquipmentCategory,
    Purpose,
    ReservationUnit,
    ReservationUnitImage,
    ReservationUnitType,
)
from reservations.models import Reservation
from spaces.models import District, Unit


class ReservationUnitFilter(filters.FilterSet):
    purpose = filters.ModelMultipleChoiceFilter(
        field_name="purposes", queryset=Purpose.objects.all()
    )
    application_round = filters.ModelMultipleChoiceFilter(
        field_name="application_rounds",
        queryset=ApplicationRound.objects.all(),
    )
    district = HierarchyModelMultipleChoiceFilter(
        field_name="spaces__district", queryset=District.objects.all()
    )
    max_persons = filters.NumberFilter(
        field_name="spaces__max_persons",
        lookup_expr="gte",
    )
    reservation_unit_type = filters.ModelChoiceFilter(
        field_name="reservation_unit_type", queryset=ReservationUnitType.objects.all()
    )
    unit = filters.ModelChoiceFilter(field_name="unit", queryset=Unit.objects.all())

    ids = NumberInFilter(field_name="id", lookup_expr="in")


class PurposeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Purpose
        fields = [
            "id",
            "name",
        ]


class ReservationUnitImageSerializer(serializers.ModelSerializer):
    image_url = serializers.ImageField(source="image", use_url=True)
    medium_url = serializers.SerializerMethodField()
    small_url = serializers.SerializerMethodField()

    class Meta:
        model = ReservationUnitImage
        fields = ["image_url", "medium_url", "small_url", "image_type"]

    def get_small_url(self, obj):
        if not obj.image:
            return None
        url = get_thumbnailer(obj.image)["small"].url
        request = self.context.get("request")
        return request.build_absolute_uri(url)

    def get_medium_url(self, obj):
        if not obj.image:
            return None
        url = get_thumbnailer(obj.image)["medium"].url
        request = self.context.get("request")
        return request.build_absolute_uri(url)


class ReservationUnitTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReservationUnitType
        fields = ["id", "name"]


class ReservationUnitSerializer(TranslatedModelSerializer):
    spaces = SpaceSerializer(
        read_only=True,
        many=True,
        help_text="Spaces included in the reservation unit as nested related objects.",
    )
    resources = ResourceSerializer(
        read_only=True,
        many=True,
        help_text="Resources included in the reservation unit as nested related objects.",
    )
    services = ServiceSerializer(
        read_only=True,
        many=True,
        help_text="Services included in the reservation unit as nested related objects.",
    )
    purposes = PurposeSerializer(many=True, read_only=True)
    images = ReservationUnitImageSerializer(
        read_only=True,
        many=True,
        help_text="Images of the reservation unit as nested related objects. ",
    )
    location = serializers.SerializerMethodField(
        help_text="Location of this reservation unit. Dynamically determined from spaces of the reservation unit."
    )
    max_persons = serializers.SerializerMethodField(
        help_text="Max persons that are allowed in this reservation unit simultaneously."
    )
    building = serializers.SerializerMethodField()
    reservation_unit_type = ReservationUnitTypeSerializer(
        read_only=True,
        help_text="Type of the reservation unit as nested related object.",
    )

    equipment_ids = serializers.PrimaryKeyRelatedField(
        queryset=Equipment.objects.all(),
        source="equipments",
        many=True,
        help_text="Ids of equipment available in this reservation unit.",
    )

    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), source="unit"
    )

    uuid = serializers.UUIDField(read_only=True)

    class Meta:
        model = ReservationUnit
        fields = [
            "id",
            "name",
            "description",
            "spaces",
            "resources",
            "services",
            "require_introduction",
            "purposes",
            "images",
            "location",
            "max_persons",
            "reservation_unit_type",
            "building",
            "terms_of_use",
            "equipment_ids",
            "unit_id",
            "uuid",
            "contact_information",
        ]
        extra_kwargs = {
            "name": {
                "help_text": "Name that describes this reservation unit.",
            },
            "require_introduction": {
                "help_text": "Determines if introduction is required in order to reserve this reservation unit.",
            },
            "terms_of_use": {
                "help_text": "Terms of use that needs to be accepted in order to reserve this reservation unit.",
            },
            "contact_information": {
                "help_text": "Contact information for this reservation unit.",
            },
        }

    def __init__(self, *args, display=False, **kwargs):
        super(ReservationUnitSerializer, self).__init__(*args, **kwargs)
        if display:
            self.fields.pop("id")

    def get_building(self, reservation_unit) -> dict:
        building = reservation_unit.get_building()
        if building:
            return BuildingSerializer(building).data

        return None

    def get_location(self, reservation_unit) -> dict:
        location = reservation_unit.get_location()
        if location:
            return LocationSerializer(location).data

        return None

    def get_max_persons(self, reservation_unit) -> int:
        return reservation_unit.get_max_persons()


class ReservationUnitViewSet(viewsets.ModelViewSet):
    serializer_class = ReservationUnitSerializer
    filter_backends = [
        drf_filters.OrderingFilter,
        filters.DjangoFilterBackend,
        drf_filters.SearchFilter,
    ]
    ordering_fields = ["name", "max_persons"]
    filterset_class = ReservationUnitFilter
    search_fields = ["name"]
    permission_classes = (
        [ReservationUnitPermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )

    def get_queryset(self):
        qs = (
            ReservationUnit.objects.annotate(max_persons=Sum("spaces__max_persons"))
            .all()
            .prefetch_related("spaces", "resources", "services")
        )
        return qs

    @action(detail=False, methods=["get"])
    def capacity(self, request, pk=None):
        reservation_units = request.query_params.get("reservation_unit")
        period_start = self.request.query_params.get("period_start")
        period_end = self.request.query_params.get("period_end")

        if not (period_start and period_end):
            raise serializers.ValidationError(
                "Parameters period_start and period_end are required."
            )
        try:
            period_start = parse(period_start).date()
            period_end = parse(period_end).date()
        except (ValueError, OverflowError):
            raise serializers.ValidationError("Wrong date format. Use YYYY-MM-dd")

        if not reservation_units:
            raise serializers.ValidationError("reservation_unit parameter is required.")

        try:
            reservation_units = [
                int(res_unit) for res_unit in reservation_units.split(",")
            ]
        except ValueError:
            raise serializers.ValidationError(
                "Given reservation unit id is not an integer"
            )

        reservation_unit_qs = ReservationUnit.objects.filter(id__in=reservation_units)

        try:
            resource_ids = reservation_unit_qs.values_list("uuid", flat=True)
            total_opening_hours = get_resources_total_hours_per_resource(
                resource_ids, period_start, period_end
            )
        except HaukiRequestError:
            total_opening_hours = {
                res_unit: "Got an error while making request to HAUKI"
                for res_unit in reservation_units
            }

        result_data = []
        for res_unit in reservation_unit_qs:
            total_duration = (
                Reservation.objects.going_to_occur()
                .filter(reservation_unit=res_unit)
                .within_period(period_start=period_start, period_end=period_end)
                .total_duration()
            ).get("total_duration")

            total_duration = (
                total_duration.total_seconds() / 3600 if total_duration else 0
            )
            resource_id = f"{settings.HAUKI_ORIGIN_ID}:{res_unit.uuid}"
            result_data.append(
                {
                    "id": res_unit.id,
                    "hour_capacity": total_opening_hours.get(resource_id),
                    "reservation_duration_total": total_duration,
                    "period_start": period_start,
                    "period_end": period_end,
                }
            )
        return Response(result_data)


class PurposeViewSet(
    viewsets.GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin
):
    serializer_class = PurposeSerializer
    queryset = Purpose.objects.all()
    permission_classes = (
        [PurposePermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )


class ReservationUnitTypeViewSet(
    viewsets.GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin
):
    serializer_class = ReservationUnitTypeSerializer
    queryset = ReservationUnitType.objects.all()
    permission_classes = (
        [ReservationUnitTypePermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )


class EquipmentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = EquipmentCategory
        fields = [
            "id",
            "name",
        ]


class EquipmentCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = EquipmentCategorySerializer
    queryset = EquipmentCategory.objects.all()
    permission_classes = (
        [EquipmentCategoryPermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )


class EquipmentSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=EquipmentCategory.objects.all(), source="category"
    )

    class Meta:
        model = Equipment
        fields = ["id", "name", "category_id"]


class EquipmentViewSet(viewsets.ModelViewSet):
    serializer_class = EquipmentSerializer
    queryset = Equipment.objects.all()
    permission_classes = (
        [EquipmentPermission]
        if not settings.TMP_PERMISSIONS_DISABLED
        else [permissions.AllowAny]
    )
