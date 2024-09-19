from __future__ import annotations

from typing import TYPE_CHECKING, Literal, Self

from django.contrib.postgres.aggregates import ArrayAgg
from django.db import models
from django.db.models import Subquery
from django.db.models.functions import Coalesce
from lookup_property import L

if TYPE_CHECKING:
    from applications.enums import ApplicationStatusChoice
    from applications.models import Application


class ApplicationQuerySet(models.QuerySet):
    def has_status(self, status: ApplicationStatusChoice) -> Self:
        return self.filter(L(status=status.value))

    def has_status_in(self, statuses: list[str]) -> Self:
        return self.filter(L(status__in=statuses))

    def preferred_unit_name_alias(self, *, lang: Literal["fi", "en", "sv"]) -> Self:
        # Name of the unit of the most preferred reservation unit
        # of the first event created for this application
        from applications.models import ApplicationSection

        return self.alias(
            **{
                f"preferred_unit_name_{lang}": Subquery(
                    queryset=(
                        ApplicationSection.objects.preferred_unit_name_alias(lang=lang)
                        .annotate(preferred_unit_name=models.F(f"preferred_unit_name_{lang}"))
                        .filter(application=models.OuterRef("pk"))
                        .order_by("pk")
                        .values("preferred_unit_name")[:1]
                    ),
                    output_field=models.CharField(),
                ),
            },
        )

    def order_by_preferred_unit_name(self, *, lang: Literal["fi", "en", "sv"], desc: bool = False) -> Self:
        return self.preferred_unit_name_alias(lang=lang).order_by(
            models.OrderBy(models.F(f"preferred_unit_name_{lang}"), descending=desc),
        )

    def order_by_status(self, *, desc: bool = False) -> Self:
        return self.order_by(models.OrderBy(L("status_sort_order"), descending=desc))

    def order_by_applicant(self, desc: bool = False) -> Self:
        return self.order_by(models.OrderBy(L("applicant"), descending=desc))

    def order_by_applicant_type(self, desc: bool = False) -> Self:
        return self.order_by(models.OrderBy(L("applicant_type_sort_order"), descending=desc))

    def _fetch_all(self) -> None:
        super()._fetch_all()
        if "FETCH_UNITS_FOR_PERMISSIONS_FLAG" in self._hints:
            self._hints.pop("FETCH_UNITS_FOR_PERMISSIONS_FLAG", None)
            self._add_units_for_permissions()

    def with_permissions(self) -> Self:
        """Indicates that we need to fetch units for permissions checks when the queryset is evaluated."""
        self._hints["FETCH_UNITS_FOR_PERMISSIONS_FLAG"] = True
        return self

    def _add_units_for_permissions(self) -> None:
        # This works sort of like a 'prefetch_related', since it makes another query
        # to fetch units and unit groups for the permission checks when the queryset is evaluated,
        # and 'joins' them to the correct model instances in python.
        from tilavarauspalvelu.models import Unit

        items: list[Application] = list(self)
        if not items:
            return

        units = (
            Unit.objects.prefetch_related("unit_groups")
            .filter(reservationunit__reservation_unit_options__application_section__application__in=items)
            .annotate(
                application_ids=Coalesce(
                    ArrayAgg(
                        "reservationunit__reservation_unit_options__application_section__application",
                        distinct=True,
                        filter=(
                            models.Q(reservationunit__isnull=False)
                            & models.Q(reservationunit__reservation_unit_options__isnull=False)
                        ),
                    ),
                    models.Value([]),
                )
            )
            .distinct()
        )

        for item in items:
            item.units_for_permissions = [unit for unit in units if item.pk in unit.application_ids]
