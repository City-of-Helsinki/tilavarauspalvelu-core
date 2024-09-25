from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import ReservationUnitPaymentType

__all__ = [
    "ReservationUnitPaymentTypeNode",
]


class ReservationUnitPaymentTypeNode(DjangoNode):
    class Meta:
        model = ReservationUnitPaymentType
        fields = [
            "code",
        ]
