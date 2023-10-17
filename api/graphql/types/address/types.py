from api.graphql.extensions.base_types import DjangoAuthNode
from api.graphql.types.address.permissions import AddressPermission
from applications.models import Address


class AddressNode(DjangoAuthNode):
    class Meta:
        model = Address
        fields = [
            "pk",
            "street_address",
            "post_code",
            "city",
        ]
        permission_classes = (AddressPermission,)
