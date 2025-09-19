from django.db import models
from lookup_property import L
from undine import Field, GQLInfo, QueryType
from undine.optimizer import OptimizationData
from undine.relay import Node

from tilavarauspalvelu.api.graphql.extensions.utils import TranslatedField
from tilavarauspalvelu.models import Application, ApplicationRound, ReservationUnit, User
from utils.db import SubqueryCount

from .filtersets import ApplicationRoundFilterSet
from .ordersets import ApplicationRoundOrderSet

__all__ = [
    "ApplicationRoundNode",
]


class ApplicationRoundNode(
    QueryType[ApplicationRound],
    filterset=ApplicationRoundFilterSet,
    orderset=ApplicationRoundOrderSet,
    interfaces=[Node],
):
    pk = Field()

    name = Field(TranslatedField)
    name_fi = Field(deprecation_reason="Use 'name' instead.")
    name_sv = Field(deprecation_reason="Use 'name' instead.")
    name_en = Field(deprecation_reason="Use 'name' instead.")

    terms_of_use = Field()

    criteria = Field(TranslatedField)
    criteria_fi = Field(deprecation_reason="Use 'criteria' instead.")
    criteria_sv = Field(deprecation_reason="Use 'criteria' instead.")
    criteria_en = Field(deprecation_reason="Use 'criteria' instead.")

    notes_when_applying = Field(TranslatedField)
    notes_when_applying_fi = Field(deprecation_reason="Use 'notes_when_applying' instead.")
    notes_when_applying_sv = Field(deprecation_reason="Use 'notes_when_applying' instead.")
    notes_when_applying_en = Field(deprecation_reason="Use 'notes_when_applying' instead.")

    application_period_begins_at = Field()
    application_period_ends_at = Field()
    reservation_period_begin_date = Field()
    reservation_period_end_date = Field()
    public_display_begins_at = Field()
    public_display_ends_at = Field()

    handled_at = Field()
    sent_at = Field()

    reservation_units = Field()
    purposes = Field()

    status = Field(L("status"))
    status_timestamp = Field(L("status_timestamp"))

    reservation_creation_status = Field(L("reservation_creation_status"))

    applications_count = Field(
        SubqueryCount(
            queryset=Application.objects.filter(
                application_round=models.OuterRef("pk"),
                cancelled_at__isnull=True,
                sent_at__isnull=False,
            ),
        ),
    )
    reservation_unit_count = Field(
        SubqueryCount(
            queryset=ReservationUnit.objects.filter(
                application_rounds=models.OuterRef("pk"),
            ),
        ),
    )

    @Field
    def is_setting_handled_allowed(root: ApplicationRound, info: GQLInfo[User]) -> bool:
        user = info.context.user
        if not user.permissions.can_manage_application_round(root):
            return False

        return root.is_setting_handled_allowed  # type: ignore[return-value]

    @is_setting_handled_allowed.optimize
    def optimize_is_setting_handled_allowed(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        # See 'tilavarauspalvelu.models.application_round.queryset.ApplicationRoundQuerySet.with_permissions'
        data.aliases["FETCH_UNITS_FOR_PERMISSIONS_FLAG"] = models.Value("")

        data.annotations["is_setting_handled_allowed"] = L("is_setting_handled_allowed")
