from graphene_django_extensions import DjangoNode
from graphene_django_extensions.permissions import AllowAuthenticated

from tilavarauspalvelu.models import Person


class PersonNode(DjangoNode):
    class Meta:
        model = Person
        fields = [
            "pk",
            "first_name",
            "last_name",
            "email",
            "phone_number",
        ]
        permission_classes = [AllowAuthenticated]
