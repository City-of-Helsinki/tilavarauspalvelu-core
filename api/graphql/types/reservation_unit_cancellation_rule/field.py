from graphene_permissions.mixins import AuthFilter

from api.graphql.types.reservation_unit_cancellation_rule.permissions import ReservationUnitCancellationRulePermission


class ReservationUnitCancellationRulesFilter(AuthFilter):
    permission_classes = (ReservationUnitCancellationRulePermission,)
