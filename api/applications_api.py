from datetime import datetime

from dateutil.parser import parse
from django.utils import timezone
from rest_framework import serializers, viewsets

from applications.models import (
    Address,
    Application,
    ApplicationEvent,
    Organisation,
    Person,
    Recurrence,
)

MINIMUM_TIME = timezone.datetime(
    1970, 1, 1, 0, 0, 0, 3, timezone.get_default_timezone()
)

MAXIMUM_TIME = timezone.datetime(
    2099, 1, 1, 0, 0, 0, 3, timezone.get_default_timezone()
)


class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Person

        fields = ["id", "first_name", "last_name"]


class PersonViewSet(viewsets.ModelViewSet):

    queryset = Person.objects.all()

    serializer_class = PersonSerializer

    def perform_create(self, serializer):
        serializer.save()


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


class ApplicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Application
        fields = [
            "id",
            "description",
            "reservation_purpose",
            "organisation",
            "contact_person",
            "user",
            "organisation",
        ]

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
