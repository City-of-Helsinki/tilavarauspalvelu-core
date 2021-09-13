import graphene
from django.core.exceptions import ValidationError
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
    errors = graphene.String()

    class Input:
        pk = graphene.ID()

    @classmethod
    def mutate_and_get_payload(cls, root, info, **input):
        if not cls.has_permission(root, info, input):
            return cls(errors="No permissions to perform delete.", deleted=False)

        try:
            if cls.is_valid(root, info, **input):
                object = get_object_or_404(cls.model, pk=input["pk"])
                object.delete()
                return cls(deleted=True)
        except ValidationError as ve:
            message = ve.message

        return cls(errors=message, deleted=False)

    @classmethod
    def validate(self, root, info, **input):
        """Classes that ought to be overriding this method should raise django's
        ValidationError if there's some validation problem. It gets caught in
        `mutate_and_get_payload` method and returned as an error.
        """
        return None

    @classmethod
    def is_valid(cls, root, info, **input):
        errors = cls.validate(root, info, **input)
        is_valid = False if errors else True
        return is_valid
