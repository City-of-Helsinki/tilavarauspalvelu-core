import graphene
from graphene import relay
from graphene_django.filter import DjangoFilterConnectionField
from graphene_django.forms.mutation import DjangoModelFormMutation
from graphene_permissions.mixins import AuthFilter
from graphene_permissions.permissions import AllowAuthenticated

from api.graphql.reservation_units.reservation_unit_types import ReservationUnitType
from api.graphql.reservations.reservation_types import ReservationType
from reservations.forms import ReservationForm


class ReservationMutation(DjangoModelFormMutation):
    reservation = graphene.Field(ReservationType)

    class Meta:
        form_class = ReservationForm


class AllowAuthenticatedFilter(AuthFilter):
    permission_classes = (AllowAuthenticated,)


class Query(graphene.ObjectType):
    reservation_units = DjangoFilterConnectionField(ReservationUnitType)
    reservation_unit = relay.Node.Field(ReservationUnitType)


class Mutation(graphene.ObjectType):
    create_reservation = ReservationMutation.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
