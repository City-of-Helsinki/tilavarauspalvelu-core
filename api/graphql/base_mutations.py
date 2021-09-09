import graphene
from graphene_permissions.mixins import AuthMutation
from rest_framework.exceptions import PermissionDenied
from rest_framework.generics import get_object_or_404


class AuthSerializerMutation(AuthMutation):
    @classmethod
    def mutate_and_get_payload(cls, root, info, **input):
        if not cls.has_permission(root, info, input):
            raise PermissionDenied("No permission to mutate")

        return super().mutate_and_get_payload(root, info, **input)


class AuthDeleteMutation(AuthMutation):
    deleted = graphene.Boolean()

    class Input:
        pk = graphene.ID()

    @classmethod
    def mutate_and_get_payload(cls, root, info, **input):
        if cls.has_permission(root, info, input):
            object = get_object_or_404(cls.model, pk=input["pk"])
            object.delete()
            return cls(deleted=True)
