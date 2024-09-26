from graphene_django_extensions import NestingModelSerializer

from tilavarauspalvelu.models import Address


class AddressSerializer(NestingModelSerializer):
    class Meta:
        model = Address
        fields = [
            "pk",
            "street_address",
            "post_code",
            "city",
        ]
        read_only_fields = [
            "pk",
        ]
