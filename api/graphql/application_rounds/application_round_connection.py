import graphene
from graphene import Connection


class ApplicationRoundConnection(Connection):
    class Meta:
        abstract = True

    total_count = graphene.Int()

    def resolve_total_count(self, info: graphene.ResolveInfo):
        return self.length
