from typing import Literal, Self

from django.db import models
from django.db.models import Subquery

from applications.choices import ApplicantTypeChoice, ApplicationStatusChoice
from applications.querysets.helpers import applicant_alias_case, application_status_case, unallocated_schedule_count


class ApplicationQuerySet(models.QuerySet):
    def order_by_expression(self, alias: str, expression: models.Expression, *, desc: bool = False) -> Self:
        order_by = models.OrderBy(models.F(alias), descending=desc)
        return self.alias(**{alias: expression}).order_by(order_by)

    def reached_allocation(self) -> Self:
        """How many applications in this application round reached allocation stage?"""
        return self.filter(cancelled_date__isnull=True, sent_date__isnull=False)

    def with_applicant_alias(self) -> Self:
        return self.alias(applicant=applicant_alias_case())

    def with_status(self) -> Self:
        return self.alias(
            unallocated_schedule_count=unallocated_schedule_count("application_events"),
        ).annotate(
            application_status=application_status_case(),
        )

    def has_status(self, status: ApplicationStatusChoice) -> Self:
        return self.with_status().filter(application_status=status.value)

    def has_status_in(self, statuses: list[str]) -> Self:
        return self.with_status().filter(application_status__in=statuses)

    def order_by_applicant_type(self, desc: bool = False) -> Self:
        return self.order_by_expression(alias="__applicant_type", expression=APPLICANT_TYPE_SORT_ORDER, desc=desc)

    def order_by_preferred_unit_name(self, *, lang: Literal["fi", "en", "sv"], desc: bool = False) -> Self:
        return self.preferred_unit_name_alias(lang=lang).order_by(
            models.OrderBy(models.F("preferred_unit_name"), descending=desc),
        )

    def preferred_unit_name_alias(self, lang: Literal["fi", "en", "sv"]) -> Self:
        from applications.models import ApplicationEvent, EventReservationUnit

        return self.alias(
            preferred_unit_name=Subquery(
                queryset=(
                    ApplicationEvent.objects.filter(application=models.OuterRef("pk"))
                    .annotate(
                        preferred_unit_name=Subquery(
                            queryset=(
                                EventReservationUnit.objects.filter(
                                    application_event=models.OuterRef("pk"),
                                    preferred_order=0,
                                )
                                .select_related("reservation_unit__unit")
                                # Name of the unit of the preferred reservation unit
                                .values(f"reservation_unit__unit__name_{lang}")[:1]
                            ),
                            output_field=models.CharField(),
                        ),
                    )
                    # Name of the unit of the preferred reservation unit
                    # of the first event created for this application
                    .order_by("pk")
                    .values("preferred_unit_name")[:1]
                ),
                output_field=models.CharField(),
            ),
        )

    def order_by_application_status(self, *, desc: bool = False) -> Self:
        return self.with_status().order_by_expression(
            alias="__application_status",
            expression=APPLICATION_STATUS_SORT_ORDER,
            desc=desc,
        )


APPLICANT_TYPE_SORT_ORDER = models.Case(
    models.When(
        applicant_type=ApplicantTypeChoice.ASSOCIATION,
        then=models.Value(1),
    ),
    models.When(
        applicant_type=ApplicantTypeChoice.COMMUNITY,
        then=models.Value(2),
    ),
    models.When(
        applicant_type=ApplicantTypeChoice.INDIVIDUAL,
        then=models.Value(3),
    ),
    models.When(
        applicant_type=ApplicantTypeChoice.COMPANY,
        then=models.Value(4),
    ),
    default=models.Value(5),
)


APPLICATION_STATUS_SORT_ORDER = models.Case(
    models.When(
        application_status=ApplicationStatusChoice.DRAFT,
        then=models.Value(1),
    ),
    models.When(
        application_status=ApplicationStatusChoice.CANCELLED,
        then=models.Value(2),
    ),
    models.When(
        application_status=ApplicationStatusChoice.EXPIRED,
        then=models.Value(3),
    ),
    models.When(
        application_status=ApplicationStatusChoice.RECEIVED,
        then=models.Value(4),
    ),
    models.When(
        application_status=ApplicationStatusChoice.IN_ALLOCATION,
        then=models.Value(5),
    ),
    models.When(
        application_status=ApplicationStatusChoice.HANDLED,
        then=models.Value(6),
    ),
    models.When(
        application_status=ApplicationStatusChoice.RESULTS_SENT,
        then=models.Value(7),
    ),
    default=models.Value(8),
)
