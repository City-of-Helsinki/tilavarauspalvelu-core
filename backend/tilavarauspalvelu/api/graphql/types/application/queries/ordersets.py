from __future__ import annotations

from django.db import models
from django.db.models import Subquery
from lookup_property import L
from undine import Order, OrderSet

from tilavarauspalvelu.models import Application, ApplicationSection, ReservationUnitOption

__all__ = [
    "ApplicationOrderSet",
]


class ApplicationOrderSet(OrderSet[Application], auto=False):
    pk = Order()
    applicant = Order(L("applicant"))
    applicant_type = Order(L("applicant_type_sort_order"))

    preferred_unit_name_fi = Order(
        Subquery(
            queryset=(
                ApplicationSection.objects.all()
                .annotate(
                    preferred_unit_name_fi=Subquery(
                        queryset=(
                            ReservationUnitOption.objects.filter(
                                application_section=models.OuterRef("pk"),
                                preferred_order=0,
                            ).values("reservation_unit__unit__name_fi")[:1]
                        ),
                        output_field=models.CharField(),
                    ),
                )
                .filter(application=models.OuterRef("pk"))
                .order_by("pk")
                .values("preferred_unit_name_fi")[:1]
            ),
            output_field=models.CharField(),
        ),
    )
    preferred_unit_name_en = Order(
        Subquery(
            queryset=(
                ApplicationSection.objects.all()
                .annotate(
                    preferred_unit_name_en=Subquery(
                        queryset=(
                            ReservationUnitOption.objects.filter(
                                application_section=models.OuterRef("pk"),
                                preferred_order=0,
                            ).values("reservation_unit__unit__name_en")[:1]
                        ),
                        output_field=models.CharField(),
                    ),
                )
                .filter(application=models.OuterRef("pk"))
                .order_by("pk")
                .values("preferred_unit_name_en")[:1]
            ),
            output_field=models.CharField(),
        ),
    )
    preferred_unit_name_sv = Order(
        Subquery(
            queryset=(
                ApplicationSection.objects.all()
                .annotate(
                    preferred_unit_name_sv=Subquery(
                        queryset=(
                            ReservationUnitOption.objects.filter(
                                application_section=models.OuterRef("pk"),
                                preferred_order=0,
                            ).values("reservation_unit__unit__name_sv")[:1]
                        ),
                        output_field=models.CharField(),
                    ),
                )
                .filter(application=models.OuterRef("pk"))
                .order_by("pk")
                .values("preferred_unit_name_sv")[:1]
            ),
            output_field=models.CharField(),
        ),
    )

    status = Order(L("status_sort_order"))
    sent_at = Order()
