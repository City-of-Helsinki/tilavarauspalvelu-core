from __future__ import annotations

from graphene_django_extensions import NestingModelSerializer
from rest_framework.fields import CharField, IntegerField

from tilavarauspalvelu.models import Reservation


class ReservationWorkingMemoSerializer(NestingModelSerializer):
    """Update the working memo of a reservation."""

    pk = IntegerField(required=True)
    working_memo = CharField(required=True, allow_blank=False)

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "working_memo",
        ]
