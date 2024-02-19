from typing import Literal, Self

from django.db import models
from django.db.models import Subquery
from lookup_property import L

from applications.choices import ApplicationStatusChoice


class ApplicationQuerySet(models.QuerySet):
    def reached_allocation(self) -> Self:
        """How many applications in this application round reached allocation stage?"""
        return self.filter(cancelled_date__isnull=True, sent_date__isnull=False)

    def has_status(self, status: ApplicationStatusChoice) -> Self:
        return self.filter(L(status=status.value))

    def has_status_in(self, statuses: list[str]) -> Self:
        return self.filter(L(status__in=statuses))

    def preferred_unit_name_alias(self, *, lang: Literal["fi", "en", "sv"]) -> Self:
        # Name of the unit of the most preferred reservation unit
        # of the first event created for this application
        from applications.models import ApplicationSection, ReservationUnitOption

        return self.alias(
            preferred_unit_name=Subquery(
                queryset=(
                    ApplicationSection.objects.annotate(
                        preferred_unit_name=Subquery(
                            queryset=(
                                ReservationUnitOption.objects.filter(
                                    application_section=models.OuterRef("pk"),
                                    preferred_order=0,
                                ).values(f"reservation_unit__unit__name_{lang}")[:1]
                            ),
                            output_field=models.CharField(),
                        )
                    )
                    .filter(application=models.OuterRef("pk"))
                    .order_by("pk")
                    .values("preferred_unit_name")[:1]
                ),
                output_field=models.CharField(),
            ),
        )

    def order_by_preferred_unit_name(self, *, lang: Literal["fi", "en", "sv"], desc: bool = False) -> Self:
        return self.preferred_unit_name_alias(lang=lang).order_by(
            models.OrderBy(models.F("preferred_unit_name"), descending=desc),
        )

    def order_by_status(self, *, desc: bool = False) -> Self:
        return self.order_by(models.OrderBy(L("status_sort_order"), descending=desc))

    def order_by_applicant(self, desc: bool = False) -> Self:
        return self.order_by(models.OrderBy(L("applicant"), descending=desc))

    def order_by_applicant_type(self, desc: bool = False) -> Self:
        return self.order_by(models.OrderBy(L("applicant_type_sort_order"), descending=desc))
