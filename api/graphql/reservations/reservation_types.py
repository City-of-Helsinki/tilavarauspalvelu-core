from graphene_django import DjangoObjectType

from reservations.models import Reservation


class ReservationType(DjangoObjectType):
    class Meta:
        model = Reservation
