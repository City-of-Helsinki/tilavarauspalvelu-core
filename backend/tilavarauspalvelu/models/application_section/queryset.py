from __future__ import annotations

from typing import Literal, Self

from django.db import models
from django.db.models import Subquery
from helsinki_gdpr.models import SerializableMixin
from lookup_property import L

from tilavarauspalvelu.models import ReservationUnitOption

__all__ = [
    "ApplicationSectionManager",
    "ApplicationSectionQuerySet",
]


class ApplicationSectionQuerySet(models.QuerySet):
    def has_status_in(self, statuses: list[str]) -> Self:
        return self.filter(L(status__in=statuses))

    def has_application_status_in(self, statuses: list[str]) -> Self:
        return self.filter(L(application__status__in=statuses))

    def order_by_status(self, *, desc: bool = False) -> Self:
        return self.order_by(L("status_sort_order").order_by(descending=desc))

    def order_by_application_status(self, *, desc: bool = False) -> Self:
        return self.order_by(L("application__status_sort_order").order_by(descending=desc))

    def order_by_applicant(self, *, desc: bool = False) -> Self:
        return self.order_by(L("application__applicant").order_by(descending=desc))

    def preferred_unit_name_alias(self, *, lang: Literal["fi", "en", "sv"]) -> Self:
        return self.alias(
            **{
                f"preferred_unit_name_{lang}": Subquery(
                    queryset=(
                        ReservationUnitOption.objects.filter(
                            application_section=models.OuterRef("pk"),
                            preferred_order=0,
                        ).values(f"reservation_unit__unit__name_{lang}")[:1]
                    ),
                    output_field=models.CharField(),
                ),
            },
        )

    def order_by_preferred_unit_name(self, *, lang: Literal["fi", "en", "sv"], desc: bool = False) -> Self:
        return self.preferred_unit_name_alias(lang=lang).order_by(
            models.OrderBy(models.F(f"preferred_unit_name_{lang}"), descending=desc),
        )


class ApplicationSectionManager(SerializableMixin.SerializableManager.from_queryset(ApplicationSectionQuerySet)):
    """Contains custom queryset methods and GDPR serialization."""
