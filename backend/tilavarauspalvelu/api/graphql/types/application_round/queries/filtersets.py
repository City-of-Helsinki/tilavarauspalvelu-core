from django.db import models
from lookup_property import L
from undine import Filter, FilterSet, GQLInfo
from undine.exceptions import EmptyFilterResult

from tilavarauspalvelu.enums import ApplicationRoundStatusChoice, UserRoleChoice
from tilavarauspalvelu.models import ApplicationRound, User
from utils.db import Now

__all__ = [
    "ApplicationRoundFilterSet",
]


class ApplicationRoundFilterSet(FilterSet[ApplicationRound]):
    pk = Filter(lookup="in")
    name = Filter(lookup="istartswith")

    @Filter
    def active(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        is_active = models.Q(application_period_begins_at__lte=Now(), application_period_ends_at__gte=Now())
        return is_active if value else ~is_active

    @Filter
    def ongoing(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        is_ongoing: models.Q = ~L(status=ApplicationRoundStatusChoice.RESULTS_SENT)
        return is_ongoing if value else ~is_ongoing

    @Filter(distinct=True)
    def only_with_permissions(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        if not value:
            return models.Q()

        user = info.context.user
        if user.is_anonymous or not user.is_active:
            raise EmptyFilterResult

        if user.is_superuser:
            return models.Q()

        roles = UserRoleChoice.can_manage_applications()
        if user.permissions.has_general_role(role_choices=roles):
            return models.Q()

        u_ids = user.permissions.unit_ids_where_has_role(role_choices=roles)
        g_ids = user.permissions.unit_group_ids_where_has_role(role_choices=roles)

        return models.Q(reservation_units__unit__in=u_ids) | models.Q(reservation_units__unit__unit_groups__in=g_ids)
