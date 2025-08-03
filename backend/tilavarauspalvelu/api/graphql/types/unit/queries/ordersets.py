from django.db import models
from undine import DjangoExpression, GQLInfo, Order, OrderSet

from tilavarauspalvelu.models import Reservation, ReservationUnit, Unit, UnitGroup, User
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

    unit_group_name_fi = Order(models.F("unit_group_name_fi"))
    unit_group_name_en = Order(models.F("unit_group_name_fi"))
    unit_group_name_sv = Order(models.F("unit_group_name_fi"))

    reservation_units_count = Order(models.F("reservation_units_count"))
    reservation_count = Order(models.F("reservation_count"))

    @reservation_units_count.aliases
    def reservation_units_count_aliases(self, info: GQLInfo[User], *, descending: bool) -> dict[str, DjangoExpression]:  # noqa: ARG002
        return {
            "reservation_units_count": SubqueryCount(
                ReservationUnit.objects.filter(unit=models.OuterRef("pk"), is_archived=False).values("id"),
            ),
        }

    @reservation_count.aliases
    def reservation_count_aliases(self, info: GQLInfo[User], *, descending: bool) -> dict[str, DjangoExpression]:  # noqa: ARG002
        return {
            "reservation_count": SubqueryCount(
                Reservation.objects.filter(reservation_unit__unit=models.OuterRef("pk")).values("id"),
            )
        }

    @unit_group_name_fi.aliases
    def unit_group_name_fi_aliases(self, info: GQLInfo[User], *, descending: bool) -> dict[str, DjangoExpression]:  # noqa: ARG002
        return {
            "unit_group_name_fi": models.Subquery(
                queryset=(
                    # Use the name of the linked unit group which is first alphabetically
                    UnitGroup.objects.filter(units=models.OuterRef("pk")).order_by("name_fi").values("name_fi")[:1]
                ),
            )
        }

    @unit_group_name_sv.aliases
    def unit_group_name_sv_aliases(self, info: GQLInfo[User], *, descending: bool) -> dict[str, DjangoExpression]:  # noqa: ARG002
        return {
            "unit_group_name_sv": models.Subquery(
                queryset=(
                    # Use the name of the linked unit group which is first alphabetically
                    UnitGroup.objects.filter(units=models.OuterRef("pk")).order_by("name_sv").values("name_sv")[:1]
                ),
            )
        }

    @unit_group_name_en.aliases
    def unit_group_name_en_aliases(self, info: GQLInfo[User], *, descending: bool) -> dict[str, DjangoExpression]:  # noqa: ARG002
        return {
            "unit_group_name_en": models.Subquery(
                queryset=(
                    # Use the name of the linked unit group which is first alphabetically
                    UnitGroup.objects.filter(units=models.OuterRef("pk")).order_by("name_en").values("name_en")[:1]
                ),
            )
        }
