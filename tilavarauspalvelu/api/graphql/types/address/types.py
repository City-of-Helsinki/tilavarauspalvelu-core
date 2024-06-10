from graphene_django_extensions import DjangoNode

from applications.models import Address
from tilavarauspalvelu.api.graphql.types.address.permissions import AddressPermission


class AddressNode(DjangoNode):
    class Meta:
        model = Address
        fields = [
            "pk",
            "street_address",
            "post_code",
            "city",
        ]
        permission_classes = [AddressPermission]
