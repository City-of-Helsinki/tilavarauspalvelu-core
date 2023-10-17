from graphene_permissions.permissions import AllowAuthenticated

from api.graphql.extensions.base_types import DjangoAuthNode
from applications.models import Person


class PersonNode(DjangoAuthNode):
    class Meta:
        model = Person
        fields = [
            "pk",
            "first_name",
            "last_name",
            "email",
            "phone_number",
        ]
        permission_classes = (AllowAuthenticated,)
