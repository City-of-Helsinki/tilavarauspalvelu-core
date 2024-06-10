from graphene_django_extensions import NestingModelSerializer

from applications.models import Organisation
from tilavarauspalvelu.api.graphql.types.address.serializers import AddressSerializer


class OrganisationSerializer(NestingModelSerializer):
    address = AddressSerializer(allow_null=True)

    class Meta:
        model = Organisation
        fields = [
            "pk",
            "name",
            "identifier",
            "year_established",
            "address",
            "active_members",
            "core_business",
            "organisation_type",
            "email",
        ]
        extra_kwargs = {
            "identifier": {
                "required": False,
            },
        }
