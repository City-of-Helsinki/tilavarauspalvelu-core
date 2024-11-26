from __future__ import annotations

from graphene_django_extensions import NestingModelSerializer

from tilavarauspalvelu.api.graphql.types.address.serializers import AddressSerializer
from tilavarauspalvelu.models import Organisation


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
