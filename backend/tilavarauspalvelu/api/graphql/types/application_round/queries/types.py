from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models
from lookup_property import L
from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.models import Application, ApplicationRound, ReservationUnit
from utils.db import SubqueryCount

from .filtersets import ApplicationRoundFilterSet
from .ordersets import ApplicationRoundOrderSet

if TYPE_CHECKING:
    from undine.optimizer import OptimizationData

    from tilavarauspalvelu.typing import GQLInfo


__all__ = [
    "ApplicationRoundNode",
]


class ApplicationRoundNode(
    QueryType[ApplicationRound],
    filterset=ApplicationRoundFilterSet,
    orderset=ApplicationRoundOrderSet,
    auto=False,
    interfaces=[Node],
):
    pk = Field()
    name = Field()
    terms_of_use = Field()
    criteria = Field()
    notes_when_applying = Field()

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
    def is_setting_handled_allowed(root: ApplicationRound, info: GQLInfo) -> bool:
        user = info.context.user
        if not user.permissions.can_manage_application_round(root):
            return False

        return root.is_setting_handled_allowed  # type: ignore[return-value]

    @is_setting_handled_allowed.optimize
    def optimize_is_setting_handled_allowed(self, data: OptimizationData, info: GQLInfo) -> None:
        data.annotations |= {"is_setting_handled_allowed": L("is_setting_handled_allowed")}
