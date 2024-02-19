from typing import Any

from graphene_django_extensions import NestingModelSerializer

from api.graphql.types.reservation_unit_option.serializers import ReservationUnitOptionApplicantSerializer
from api.graphql.types.suitable_time_range.serializers import SuitableTimeRangeSerializer
from applications.models import ApplicationSection
from applications.validators import validate_reservation_unit_option_preferred_ordering

__all__ = [
    "ApplicationSectionSerializer",
]


class ApplicationSectionSerializer(NestingModelSerializer):
    instance: ApplicationSection | None

    reservation_unit_options = ReservationUnitOptionApplicantSerializer(many=True)
    suitable_time_ranges = SuitableTimeRangeSerializer(many=True)

    class Meta:
        model = ApplicationSection
        fields = [
            "pk",
            "name",
            "num_persons",
            "reservations_begin_date",
            "reservations_end_date",
            "reservation_min_duration",
            "reservation_max_duration",
            "applied_reservations_per_week",
            "application",
            "purpose",
            "age_group",
            "reservation_unit_options",
            "suitable_time_ranges",
        ]

    def validate_reservation_unit_options(self, data: list[dict[str, Any]]) -> list[dict[str, Any]]:
        validate_reservation_unit_option_preferred_ordering(self.instance, data)
        return data


class ApplicationSectionForApplicationSerializer(ApplicationSectionSerializer):
    class Meta:
        model = ApplicationSection
        fields = [item for item in ApplicationSectionSerializer.Meta.fields if item != "application"]
