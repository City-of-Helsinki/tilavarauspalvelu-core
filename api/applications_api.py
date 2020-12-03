from datetime import datetime

from dateutil.parser import parse
from django.utils import timezone
from rest_framework import serializers, viewsets

from applications.models import (
    Address,
    Application,
    ApplicationEvent,
    Organisation,
    Recurrence, Person,
)

MINIMUM_TIME = timezone.datetime(
    1970, 1, 1, 0, 0, 0, 3, timezone.get_default_timezone()
)

MAXIMUM_TIME = timezone.datetime(
    2099, 1, 1, 0, 0, 0, 3, timezone.get_default_timezone()
)


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address

        fields = ["id", "street_address", "post_code", "city"]


class AddressViewSet(viewsets.ModelViewSet):

    queryset = Address.objects.all()

    serializer_class = AddressSerializer

    def perform_create(self, serializer):
        serializer.save()


class OrganisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organisation

        fields = ["id", "name", "identifier", "year_established"]


class OrganisationViewSet(viewsets.ModelViewSet):

    queryset = Organisation.objects.all()

    serializer_class = OrganisationSerializer

    def perform_create(self, serializer):
        serializer.save()


class ContactPersonSerializerField(serializers.Field):
    def to_representation(self, obj):
        values = [
            obj.contact_first_name,
            obj.contact_last_name,
            obj.contact_email,
            obj.contact_phone_number,
        ]

        if all(v is None for v in values):
            return None

        return {
            "first_name": obj.contact_first_name,
            "last_name": obj.contact_last_name,
            "email": obj.contact_email,
            "phone_number": obj.contact_phone_number,
        }

    def to_internal_value(self, data):
        internal_value = {
            "contact_first_name": None,
            "contact_last_name": None,
            "contact_email": None,
            "contact_phone_number": None,
        }

        if data is not None:
            internal_value["contact_first_name"] = data.get("first_name")
            internal_value["contact_last_name"] = data.get("last_name")
            internal_value["contact_email"] = data.get("email")
            internal_value["contact_phone_number"] = data.get("phone_number")
        return internal_value


class ApplicationSerializer(serializers.ModelSerializer):

    contact_person = ContactPersonSerializerField(source="*", allow_null=True)

    class Meta:
        model = Application
        fields = [
            "id",
            "description",
            "reservation_purpose",
            "organisation",
            "application_period",
            "user",
            "contact_person",
        ]
        read_only_fields = ["user"]

    def validate(self, data):
        return data


class ApplicationViewSet(viewsets.ModelViewSet):

    queryset = Application.objects.all()

    serializer_class = ApplicationSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class DateAwareRecurrenceReadSerializer(serializers.ModelSerializer):

    recurrence = serializers.SerializerMethodField()

    def get_recurrence(self, instance):
        return instance.recurrence.between(self.get_start_date(), self.get_end_date())

    def get_start_date(self) -> datetime:
        if "start" in self.context and self.context["start"] is not None:
            return self.context["start"]
        return MINIMUM_TIME

    def get_end_date(self) -> datetime:
        if "end" in self.context and self.context["end"] is not None:
            return self.context["end"]
        return MAXIMUM_TIME

    class Meta:
        model = Recurrence
        fields = ["id", "priority", "recurrence"]


class ApplicationEventSerializer(serializers.ModelSerializer):

    recurrences = DateAwareRecurrenceReadSerializer(many=True, read_only=True)

    class Meta:
        model = ApplicationEvent
        fields = [
            "id",
            "recurrences",
            "num_persons",
            "age_group",
            "ability_group",
            "num_events",
            "duration",
            "application",
            "timeframe_start",
            "timeframe_end"
        ]


class ApplicationEventViewSet(viewsets.ModelViewSet):
    serializer_class = ApplicationEventSerializer

    queryset = ApplicationEvent.objects.all()

    def get_serializer_context(self):
        start: datetime = self.request.query_params.get("start", None)
        end: datetime = self.request.query_params.get("end", None)
        if start is not None:
            start = parse(start)
        if end is not None:
            end = parse(end)
        return {"start": start, "end": end}
