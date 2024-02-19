from graphene_django_extensions import DjangoNode

from api.graphql.types.address.permissions import AddressPermission
from applications.models import Address


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
