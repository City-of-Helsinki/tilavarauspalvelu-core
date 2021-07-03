import graphene
from graphene_django import DjangoObjectType


class PrimaryKeyObjectType(DjangoObjectType):

    pk = graphene.Int()
    class Meta:
        abstract = True

    def resolve_pk(self, info):
        return self.id