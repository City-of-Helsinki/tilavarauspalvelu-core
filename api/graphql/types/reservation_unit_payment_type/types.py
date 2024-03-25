from graphene_django_extensions import DjangoNode

from reservation_units.models import ReservationUnitPaymentType

__all__ = [
    "ReservationUnitPaymentTypeNode",
]


class ReservationUnitPaymentTypeNode(DjangoNode):
    class Meta:
        model = ReservationUnitPaymentType
        fields = [
            "code",
        ]
