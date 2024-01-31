from django.contrib.auth import get_user_model
from django.utils.timezone import localtime
from drf_extra_fields.relations import PresentablePrimaryKeyRelatedField
from rest_framework import serializers

from api.graphql.types.resources.serializers import ResourceSerializer
from api.graphql.types.units.serializers import UnitSerializer
from reservation_units.models import Equipment, Purpose, ReservationUnit, ReservationUnitImage, ReservationUnitType
from reservations.models import AgeGroup, RecurringReservation, Reservation
from services.models import Service
from spaces.models import Building, Location, Space, Unit

from .base_serializers import OldTranslatedModelSerializer

User = get_user_model()


class BuildingSerializer(OldTranslatedModelSerializer):
    class Meta:
        model = Building
        fields = ["id", "name", "real_estate", "surface_area"]


class LocationSerializer(OldTranslatedModelSerializer):
    coordinates = serializers.SerializerMethodField()

    def get_coordinates(self, obj):
        return {"longitude": obj.lon, "latitude": obj.lat}

    class Meta:
        model = Location
        fields = ["address_street", "address_zip", "address_city", "coordinates"]
        extra_kwargs = {
            "address_street": {
                "help_text": "Street name and number for the location.",
            },
            "address_zip": {
                "help_text": "Zip code of the location.",
            },
            "address_city": {
                "help_text": "City of the location.",
            },
        }


class SpaceSerializer(OldTranslatedModelSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(
        queryset=Space.objects.all(),
        source="parent",
        help_text="Id of parent space for this space.",
        allow_null=True,
    )
    building_id = serializers.PrimaryKeyRelatedField(
        queryset=Building.objects.all(),
        source="building",
        help_text="Id of building for this space.",
        allow_null=True,
    )
    name = serializers.CharField()

    class Meta:
        model = Space
        fields = [
            "id",
            "name",
            "parent_id",
            "building_id",
            "surface_area",
        ]
        extra_kwargs = {
            "name": {
                "help_text": "Name of the space.",
            },
            "surface_area": {
                "help_text": "Surface area of the space as square meters",
            },
        }


class ServiceSerializer(OldTranslatedModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id",
            "name",
            "service_type",
            "buffer_time_before",
            "buffer_time_after",
        ]
        extra_kwargs = {
            "name": {
                "help_text": "Name of the service.",
            },
            "service_type": {
                "help_text": "Type of the service.",
            },
            "buffer_time_before": {
                "help_text": "Buffer time required before reservation if this service is used.",
            },
            "buffer_time_after": {
                "help_text": "Buffer time required after reservation if this service is used.",
            },
        }


class AgeGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = AgeGroup
        fields = [
            "id",
            "minimum",
            "maximum",
        ]
        extra_kwargs = {
            "minimum": {
                "help_text": "Minimum age of persons included in the age group.",
            },
            "maximum": {
                "help_text": "Maximum age of persons included in the age group.",
            },
        }

    def __init__(self, *args, display=False, **kwargs):
        super().__init__(*args, **kwargs)
        if display:
            self.fields.pop("id")

    def validate(self, data):
        min_age = data["minimum"]
        max_age = data["maximum"]

        if max_age is not None and max_age <= min_age:
            raise serializers.ValidationError("Maximum age should be larger than minimum age")
        return data


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
    large_url = serializers.SerializerMethodField()

    class Meta:
        model = ReservationUnitImage
        fields = ["image_url", "large_url", "medium_url", "small_url", "image_type"]

    def get_small_url(self, obj):
        if not obj.image:
            return None

        request = self.context.get("request")
        return request.build_absolute_uri(obj.small_url)

    def get_medium_url(self, obj):
        if not obj.image:
            return None

        request = self.context.get("request")
        return request.build_absolute_uri(obj.medium_url)

    def get_large_url(self, obj):
        if not obj.image:
            return None

        request = self.context.get("request")
        return request.build_absolute_uri(obj.large_url)


class ReservationUnitTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReservationUnitType
        fields = ["id", "name"]


class ReservationUnitSerializer(OldTranslatedModelSerializer):
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
        required=False,
    )

    unit_id = serializers.PrimaryKeyRelatedField(queryset=Unit.objects.all(), source="unit")

    uuid = serializers.UUIDField(read_only=True)

    unit = UnitSerializer(read_only=True, help_text="Unit linked to this reservation unit.")

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
            "unit",
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
        super().__init__(*args, **kwargs)
        if display:
            self.fields.pop("id")

    def get_building(self, reservation_unit) -> dict | None:
        building = reservation_unit.actions.get_building()
        if building:
            return BuildingSerializer(building).data

        return None

    def get_location(self, reservation_unit) -> dict | None:
        location = reservation_unit.actions.get_location()
        if location:
            return LocationSerializer(location).data

        return None

    def get_max_persons(self, reservation_unit) -> int:
        return reservation_unit.actions.get_max_persons()


class ReservationSerializer(serializers.ModelSerializer):
    reservation_units = PresentablePrimaryKeyRelatedField(
        presentation_serializer=ReservationUnitSerializer,
        many=True,
        queryset=ReservationUnit.objects.all(),
        help_text="Reservation units that are reserved by the reservation",
    )
    user_id = serializers.PrimaryKeyRelatedField(
        read_only=True,
        source="user",
        help_text="Id of user for this reservation.",
    )
    begin_weekday = serializers.SerializerMethodField()
    application_event_name = serializers.SerializerMethodField()
    reservation_user = serializers.SerializerMethodField()

    class Meta:
        model = Reservation
        fields = [
            "id",
            "state",
            "priority",
            "user_id",
            "begin_weekday",
            "begin",
            "end",
            "buffer_time_before",
            "buffer_time_after",
            "application_event_name",
            "reservation_user",
            "reservation_units",
            "recurring_reservation",
            "type",
        ]

    def get_begin_weekday(self, instance: Reservation):
        return instance.begin.weekday()

    def get_application_event_name(self, instance: Reservation):
        if instance.recurring_reservation:
            return instance.recurring_reservation.application_event_schedule.application_event.name
        return None

    def get_reservation_user(self, instance: Reservation):
        if not instance.recurring_reservation:
            return None

        org = instance.recurring_reservation.application_event_schedule.application_event.application.organisation
        if org:
            return org.name

        return instance.user.get_full_name()

    def validate(self, data):
        for reservation_unit in data["reservation_units"]:
            if reservation_unit.actions.check_reservation_overlap(data["begin"], data["end"], self.instance):
                raise serializers.ValidationError("Overlapping reservations are not allowed")
        return data


class RecurringReservationSerializer(serializers.ModelSerializer):
    reservations = PresentablePrimaryKeyRelatedField(
        presentation_serializer=ReservationSerializer,
        many=True,
        queryset=Reservation.objects.all(),
        help_text="This recurring reservation's reservations.",
    )
    first_reservation_begin = serializers.SerializerMethodField()
    last_reservation_end = serializers.SerializerMethodField()
    begin_weekday = serializers.SerializerMethodField()
    age_group = PresentablePrimaryKeyRelatedField(
        presentation_serializer=AgeGroupSerializer,
        queryset=AgeGroup.objects.all(),
    )
    purpose_name = serializers.SerializerMethodField()
    group_size = serializers.SerializerMethodField()
    denied_reservations = ReservationSerializer(many=True, read_only=True)
    biweekly = serializers.BooleanField(source="application_event.biweekly", read_only=True)

    class Meta:
        model = RecurringReservation
        fields = [
            "id",
            "application_event_schedule_id",
            "age_group",
            "purpose_name",
            "group_size",
            "ability_group_id",
            "begin_weekday",
            "first_reservation_begin",
            "last_reservation_end",
            "biweekly",
            "reservations",
            "denied_reservations",
        ]

    def get_begin_weekday(self, instance: RecurringReservation):
        reservations = instance.reservations.all()

        if reservations:
            reservations = sorted(reservations, key=lambda res: res.begin)

            return reservations[0].begin.weekday()

        return None

    def get_first_reservation_begin(self, instance: RecurringReservation):
        reservations = instance.reservations.all()

        if reservations:
            reservations = sorted(reservations, key=lambda res: res.begin)

            return localtime(reservations[0].begin)

        return None

    def get_last_reservation_end(self, instance: RecurringReservation):
        reservations = instance.reservations.all()

        if reservations:
            reservations = sorted(reservations, key=lambda res: res.end)

            return localtime(reservations[0].end)

        return None

    def get_purpose_name(self, instance: RecurringReservation):
        purpose = instance.application_event_schedule.application_event.purpose
        if purpose:
            return purpose.name
        return None

    def get_group_size(self, instance):
        return instance.application_event.num_persons
