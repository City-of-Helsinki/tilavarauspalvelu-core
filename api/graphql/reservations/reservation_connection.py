import graphene
from graphene import Connection


class ReservationConnection(Connection):
    class Meta:
        abstract = True

    total_count = graphene.Int()

    def resolve_total_count(self, info, **kwargs):
        return self.length
