from graphene_django_extensions import NestingModelSerializer

from applications.models import ReservationUnitOption


class ReservationUnitOptionApplicantSerializer(NestingModelSerializer):
    class Meta:
        model = ReservationUnitOption
        fields = [
            "pk",
            "preferred_order",
            "reservation_unit",
        ]


class ReservationUnitOptionHandlerSerializer(NestingModelSerializer):
    class Meta:
        model = ReservationUnitOption
        fields = [
            "pk",
            "rejected",
            "locked",
        ]
