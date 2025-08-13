from django.db import models
from undine import Order, OrderSet

from tilavarauspalvelu.models import Reservation, ReservationUnit, Unit, UnitGroup
from utils.db import SubqueryCount

__all__ = [
    "UnitOrderSet",
]


class UnitOrderSet(OrderSet[Unit]):
    pk = Order()
    rank = Order()

    name_fi = Order()
    name_en = Order()
    name_sv = Order()

    unit_group_name_fi = Order(
        models.Subquery(
            queryset=UnitGroup.objects.filter(units=models.OuterRef("pk")).order_by("name_fi").values("name_fi")[:1],
            output_field=models.CharField(null=True),
        ),
    )

    unit_group_name_en = Order(
        models.Subquery(
            queryset=UnitGroup.objects.filter(units=models.OuterRef("pk")).order_by("name_en").values("name_en")[:1],
            output_field=models.CharField(null=True),
        ),
    )

    unit_group_name_sv = Order(
        models.Subquery(
            queryset=UnitGroup.objects.filter(units=models.OuterRef("pk")).order_by("name_sv").values("name_sv")[:1],
            output_field=models.CharField(null=True),
        ),
    )

    reservation_units_count = Order(
        SubqueryCount(
            queryset=ReservationUnit.objects.filter(unit=models.OuterRef("pk"), is_archived=False).values("id"),
        ),
    )

    reservation_count = Order(
        SubqueryCount(
            queryset=Reservation.objects.filter(reservation_unit__unit=models.OuterRef("pk")).values("id"),
        ),
    )
