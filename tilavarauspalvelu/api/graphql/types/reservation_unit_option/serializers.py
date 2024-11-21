from graphene_django_extensions import NestingModelSerializer
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.models import ReservationUnitOption


class ReservationUnitOptionApplicantSerializer(NestingModelSerializer):
    class Meta:
        model = ReservationUnitOption
        fields = [
            "pk",
            "preferred_order",
            "reservation_unit",
        ]


class ReservationUnitOptionHandlerSerializer(NestingModelSerializer):
    instance: ReservationUnitOption

    class Meta:
        model = ReservationUnitOption
        fields = [
            "pk",
            "rejected",
            "locked",
        ]

    def validate_rejected(self, value: bool) -> bool:  # noqa: FBT001
        if value and self.instance.allocated_time_slots.exists():
            msg = "Cannot reject a reservation unit option with allocations"
            raise ValidationError(msg)
        return value
