import datetime
import hashlib
import hmac
import io
from typing import Any, Union
from urllib.parse import urlsplit

from django.conf import settings
from django.http import FileResponse, Http404
from django.utils.timezone import get_default_timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from icalendar import Calendar, Event
from rest_framework import mixins, serializers, viewsets
from rest_framework.exceptions import ValidationError
from rest_framework.request import Request
from rest_framework.reverse import reverse
from rest_framework.viewsets import ViewSet

from applications.models import ApplicationEvent
from permissions.api_permissions.drf_permissions import (
    ReservationUnitCalendarUrlPermission,
)
from reservation_units.models import ReservationUnit
from reservations.models import Reservation


def hmac_signature(value: Any) -> str:
    return hmac.new(
        key=settings.ICAL_HASH_SECRET.encode("utf-8"),
        msg=str(value).encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()


def get_host(request: Union[Request, None]):
    return request.get_host() if request else None


class ReservationUnitCalendarUrlSerializer(serializers.ModelSerializer):
    calendar_url = serializers.SerializerMethodField()

    class Meta:
        model = ApplicationEvent
        fields = ["calendar_url"]

    def get_calendar_url(self, instance):
        request = self.context["request"] if "request" in self.context else None
        scheme = urlsplit(request.build_absolute_uri(None)).scheme if request else "http"
        calendar_url = reverse("reservation_unit_calendar-detail", kwargs={"pk": instance.id})

        return f"{scheme}://{get_host(request)}{calendar_url}?hash={hmac_signature(instance.uuid)}"


class ReservationIcalViewset(ViewSet):
    queryset = Reservation.objects.all()

    def get_object(self):
        return Reservation.objects.filter(pk=self.kwargs["pk"]).prefetch_related("reservation_unit").first()

    def retrieve(self, request, *args, **kwargs):
        hash = request.query_params.get("hash", None)
        if hash is None:
            raise ValidationError("hash is required")

        instance = self.get_object()
        # We use a prefix for the value to sign, because using the plain integer PK
        # could enable reusing the hashes for accessing other resources.
        comparison_signature = hmac_signature(f"reservation-{instance.pk}")

        if not hmac.compare_digest(comparison_signature, hash):
            raise ValidationError("invalid hash signature")

        buffer = io.BytesIO()
        buffer.write(
            export_reservation_events(
                instance,
                get_host(request),
                reservation_unit_calendar(instance.reservation_unit),
            ).to_ical()
        )
        buffer.seek(0)

        return FileResponse(buffer, as_attachment=True, filename="reservation_calendar.ics")


class ReservationUnitCalendarUrlViewSet(
    viewsets.GenericViewSet,
    mixins.RetrieveModelMixin,
):
    serializer_class = ReservationUnitCalendarUrlSerializer
    queryset = ReservationUnit.objects.all().prefetch_related("unit")
    permission_classes = [ReservationUnitCalendarUrlPermission]


class ReservationUnitIcalViewset(ViewSet):
    queryset = ReservationUnit.objects.all()

    def get_object(self):
        return ReservationUnit.objects.get(pk=self.kwargs["pk"])

    def retrieve(self, request, *args, **kwargs):
        hash = request.query_params.get("hash", None)
        if not hash:
            raise ValidationError("hash is required")

        instance = self.get_object()

        comparison_signature = hmac_signature(instance.uuid)

        if not hmac.compare_digest(comparison_signature, hash):
            raise ValidationError("invalid hash signature")

        buffer = io.BytesIO()
        buffer.write(
            export_reservation_unit_events(instance, get_host(request), reservation_unit_calendar(instance)).to_ical()
        )
        buffer.seek(0)

        return FileResponse(buffer, as_attachment=True, filename="reservation_unit_calendar.ics")


class ApplicationEventIcalViewset(ViewSet):
    queryset = ApplicationEvent.objects.all()

    @extend_schema(
        parameters=[
            OpenApiParameter(
                "id",
                OpenApiTypes.UUID,
                OpenApiParameter.PATH,
                description="UUID of the application event.",
            )
        ],
        description="Get iCalendar for an application event.",
        auth=None,
    )
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        buffer = io.BytesIO()
        buffer.write(
            export(
                instance,
                get_host(request),
                application_event_calendar(instance),
            ).to_ical()
        )
        buffer.seek(0)

        return FileResponse(buffer, as_attachment=True, filename="application_event_calendar.ics")

    def get_object(self):
        application_event = (
            ApplicationEvent.objects.filter(uuid=self.kwargs["pk"])
            .select_related(
                "application",
                "application__organisation",
                "application__contact_person",
            )
            .first()
        )

        if application_event:
            return application_event

        raise Http404


ICAL_VERSION = "2.0"


def reservation_unit_calendar(reservation_unit: ReservationUnit):
    cal = Calendar()

    cal.add("version", ICAL_VERSION)
    cal["x-wr-calname"] = reservation_unit.name
    return cal


def application_event_calendar(application_event: ApplicationEvent) -> Calendar:
    cal = Calendar()

    cal.add("version", ICAL_VERSION)

    organisation = application_event.application.organisation
    contact_person = application_event.application.contact_person

    applicant_name = ""
    if organisation:
        applicant_name = organisation.name
    elif contact_person:
        applicant_name = f"{contact_person.first_name} {contact_person.last_name}"

    cal["x-wr-calname"] = f"{applicant_name}, " f"{application_event.name}"
    return cal


def export_reservation_unit_events(reservation_unit: ReservationUnit, site_name: str, cal: Calendar):
    reservations = Reservation.objects.filter(reservation_unit=reservation_unit)
    for reservation in reservations:
        export_reservation_events(reservation, site_name, cal)
    return cal


def export_reservation_events(reservation: Reservation, site_name: str, cal: Calendar):
    ical_event = Event()
    ical_event.add("summary", reservation.get_ical_summary())
    ical_event.add("dtstart", reservation.begin)
    ical_event.add("dtend", reservation.end)
    ical_event.add("dtstamp", datetime.datetime.now(tz=get_default_timezone()))
    ical_event.add("description", reservation.get_ical_description())
    ical_event.add("location", reservation.get_location_string())
    ical_event["uid"] = f"{reservation.pk}.event.events.{site_name}"
    cal.add_component(ical_event)
    return cal


def export(application_event: ApplicationEvent, site_name: str, cal: Calendar) -> Calendar:
    reservations = Reservation.objects.filter(recurring_reservation__application_event=application_event)
    for reservation in reservations:
        ical_event = Event()
        ical_event.add("summary", application_event.name)
        ical_event.add("dtstart", reservation.begin)
        ical_event.add("dtend", reservation.end)
        ical_event.add("dtstamp", datetime.datetime.now(tz=get_default_timezone()))
        ical_event.add("description", reservation.get_ical_description())
        ical_event.add("location", reservation.get_location_string())
        ical_event["uid"] = "%s.event.events.%s" % (reservation.id, site_name)
        cal.add_component(ical_event)
    return cal
