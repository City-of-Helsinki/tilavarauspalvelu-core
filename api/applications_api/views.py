from datetime import datetime

from dateutil.parser import parse
from rest_framework import viewsets

from api.applications_api.serializers import (
    AddressSerializer,
    ApplicationEventSerializer,
    ApplicationSerializer,
)
from applications.models import Address, Application, ApplicationEvent


class AddressViewSet(viewsets.ModelViewSet):

    queryset = Address.objects.all()

    serializer_class = AddressSerializer

    def perform_create(self, serializer):
        serializer.save()


class ApplicationViewSet(viewsets.ModelViewSet):

    queryset = Application.objects.all()

    serializer_class = ApplicationSerializer


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
