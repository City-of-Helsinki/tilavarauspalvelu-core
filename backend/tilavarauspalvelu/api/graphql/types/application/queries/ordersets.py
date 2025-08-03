from django.db import models
from django.db.models import Subquery
from lookup_property import L
from undine import DjangoExpression, GQLInfo, Order, OrderSet

from tilavarauspalvelu.models import Application, ApplicationSection, ReservationUnitOption, User

__all__ = [
    "ApplicationOrderSet",
]


class ApplicationOrderSet(OrderSet[Application]):
    pk = Order()
    applicant = Order(L("applicant"))
    applicant_type = Order(L("applicant_type_sort_order"))

    preferred_unit_name_fi = Order(models.F("preferred_unit_name_fi"))
    preferred_unit_name_sv = Order(models.F("preferred_unit_name_sv"))
    preferred_unit_name_en = Order(models.F("preferred_unit_name_en"))

    status = Order(L("status_sort_order"))
    sent_at = Order()

    @preferred_unit_name_fi.aliases
    def preferred_unit_name_fi_aliases(self, info: GQLInfo[User], *, descending: bool) -> dict[str, DjangoExpression]:  # noqa: ARG002
        return {
            "preferred_unit_name_fi": Subquery(
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
        }

    @preferred_unit_name_sv.aliases
    def preferred_unit_name_sv_aliases(self, info: GQLInfo[User], *, descending: bool) -> dict[str, DjangoExpression]:  # noqa: ARG002
        return {
            "preferred_unit_name_sv": Subquery(
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
        }

    @preferred_unit_name_en.aliases
    def preferred_unit_name_en_aliases(self, info: GQLInfo[User], *, descending: bool) -> dict[str, DjangoExpression]:  # noqa: ARG002
        return {
            "preferred_unit_name_en": Subquery(
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
        }
