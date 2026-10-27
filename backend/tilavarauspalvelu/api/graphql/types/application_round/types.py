from __future__ import annotations

from typing import TYPE_CHECKING

import graphene
from django.db import models
from graphene_django_extensions import DjangoNode
from lookup_property import L
from query_optimizer import AnnotatedField

from tilavarauspalvelu.api.graphql.types.price_option.types import PriceOptionNode
from tilavarauspalvelu.enums import ApplicationRoundReservationCreationStatusChoice, ApplicationRoundStatusChoice
from tilavarauspalvelu.models import Application, ApplicationRound, ReservationUnit
from tilavarauspalvelu.services.pricing.application_round_options import application_round_price_options
from utils.db import SubqueryCount

from .filtersets import ApplicationRoundFilterSet
from .permissions import ApplicationRoundPermission

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PriceOption
    from tilavarauspalvelu.models.application_round.queryset import ApplicationRoundQuerySet
    from tilavarauspalvelu.typing import Any, AnyUser, GQLInfo


class ApplicationRoundNode(DjangoNode):
    status = AnnotatedField(
        graphene.Enum.from_enum(ApplicationRoundStatusChoice),
        expression=L("status"),
        required=True,
    )
    status_timestamp = AnnotatedField(
        graphene.DateTime,
        expression=L("status_timestamp"),
    )
    reservation_creation_status = AnnotatedField(
        graphene.Enum.from_enum(ApplicationRoundReservationCreationStatusChoice),
        expression=L("reservation_creation_status"),
        required=True,
    )
    is_setting_handled_allowed = AnnotatedField(
        graphene.Boolean,
        expression=L("is_setting_handled_allowed"),
        required=True,
    )
    applications_count = AnnotatedField(
        graphene.Int,
        expression=SubqueryCount(
            queryset=Application.objects.filter(
                application_round=models.OuterRef("pk"),
                cancelled_at__isnull=True,
                sent_at__isnull=False,
            ),
        ),
        required=True,
    )
    reservation_unit_count = AnnotatedField(
        graphene.Int,
        expression=SubqueryCount(
            queryset=ReservationUnit.objects.filter(
                application_rounds=models.OuterRef("pk"),
            ),
        ),
        required=True,
    )
    price_options = graphene.List(
        graphene.NonNull(PriceOptionNode),
        required=True,
        description=(
            "Price options that the applicant can select for each application section. "
            "Computed for each round, so query this only for a few rounds at a time."
        ),
    )

    class Meta:
        model = ApplicationRound
        fields = [
            "pk",
            "name",
            "terms_of_use",
            "criteria",
            "notes_when_applying",
            "application_period_begins_at",
            "application_period_ends_at",
            "reservation_period_begin_date",
            "reservation_period_end_date",
            "public_display_begins_at",
            "public_display_ends_at",
            "handled_at",
            "sent_at",
            "reservation_units",
            "purposes",
            "status",
            "status_timestamp",
            "applications_count",
            "reservation_unit_count",
            "reservation_creation_status",
            "is_setting_handled_allowed",
            "price_options",
        ]
        filterset_class = ApplicationRoundFilterSet
        permission_classes = [ApplicationRoundPermission]

    def resolve_is_setting_handled_allowed(root: ApplicationRound, info: GQLInfo) -> bool:
        user: AnyUser = info.context.user
        if not user.permissions.can_manage_application_round(root):
            return False

        return root.is_setting_handled_allowed

    def resolve_price_options(root: ApplicationRound, info: GQLInfo) -> list[PriceOption]:
        return application_round_price_options(root)

    @classmethod
    def pre_optimization_hook(cls, queryset: ApplicationRoundQuerySet, *args: Any) -> models.QuerySet:
        return queryset.with_permissions()
