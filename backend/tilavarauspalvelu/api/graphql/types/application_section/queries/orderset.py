from django.db import models
from django.db.models import Subquery
from django.db.models.functions import Lower
from lookup_property import L
from undine import Order, OrderSet

from tilavarauspalvelu.models import ApplicationSection, ReservationUnitOption

__all__ = [
    "ApplicationSectionOrderSet",
]


class ApplicationSectionOrderSet(OrderSet[ApplicationSection]):
    pk = Order()
    name = Order(Lower("name"))

    application = Order("application__pk")
    applicant = Order(L("application__applicant"))
    status = Order(L("status_sort_order"))
    application_status = Order(L("application__status_sort_order"))

    preferred_unit_name_fi = Order(
        Subquery(
            queryset=(
                ReservationUnitOption.objects.filter(
                    application_section=models.OuterRef("pk"),
                    preferred_order=0,
                ).values("reservation_unit__unit__name_fi")[:1]
            ),
            output_field=models.CharField(),
        ),
    )
    preferred_unit_name_en = Order(
        Subquery(
            queryset=(
                ReservationUnitOption.objects.filter(
                    application_section=models.OuterRef("pk"),
                    preferred_order=0,
                ).values("reservation_unit__unit__name_en")[:1]
            ),
            output_field=models.CharField(),
        ),
    )
    preferred_unit_name_sv = Order(
        Subquery(
            queryset=(
                ReservationUnitOption.objects.filter(
                    application_section=models.OuterRef("pk"),
                    preferred_order=0,
                ).values("reservation_unit__unit__name_sv")[:1]
            ),
            output_field=models.CharField(),
        ),
    )

    has_allocations = Order(L(allocations__gt=0))
    allocations = Order(L("allocations"))
