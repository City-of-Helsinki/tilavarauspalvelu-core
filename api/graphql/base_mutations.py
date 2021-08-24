from graphene_permissions.mixins import AuthMutation


class AuthSerializerMutation(AuthMutation):
    @classmethod
    def mutate_and_get_payload(cls, root, info, **input):
        if not cls.has_permission(root, info, input):
            return None

        return super().mutate_and_get_payload(root, info, **input)
