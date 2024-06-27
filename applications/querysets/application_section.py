from typing import Literal, Self

from django.db import models
from django.db.models import Subquery
from lookup_property import L

__all__ = [
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
        from applications.models import ReservationUnitOption

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
