from django.utils.datetime_safe import datetime
from rest_framework import serializers, viewsets
from rest_framework.response import Response

from opening_hours.hours import get_opening_hours
from reservation_units.models import ReservationUnit


class OpeningHours(object):
    def __init__(self, id: int, start_date: datetime, end_date: datetime):
        self.id = id
        self.opening_hours = self.get_hours(start_date, end_date)

    def get_hours(self, start_date: datetime, end_date: datetime):
        return get_opening_hours(
            resource_id=f"{self.id}",
            start_date=start_date,
            end_date=end_date,
        )


class OpenTimeSerializer(serializers.Serializer):
    start_time = serializers.TimeField(read_only=True)
    end_time = serializers.TimeField(read_only=True)
    end_time_on_next_day = serializers.BooleanField(read_only=True)


class OpeningHourDateSerialiser(serializers.Serializer):
    date = serializers.DateField(read_only=True)
    times = OpenTimeSerializer(read_only=True, many=True)


class OpeningHoursSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    opening_hours = OpeningHourDateSerialiser(read_only=True, many=True)


class OpeningHoursViewSet(viewsets.ViewSet):
    serializer_class = OpeningHoursSerializer

    def retrieve(self, request, pk=None):
        start_date = self.request.query_params.get("start_date")
        end_date = self.request.query_params.get("end_date")
        unit = ReservationUnit.objects.get(pk=pk)
        return Response(
            OpeningHoursSerializer(
                instance=OpeningHours(
                    id=unit.id, start_date=start_date, end_date=end_date
                )
            ).data
        )
