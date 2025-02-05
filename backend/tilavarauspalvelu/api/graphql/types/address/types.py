from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import Address

from .permissions import AddressPermission


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
