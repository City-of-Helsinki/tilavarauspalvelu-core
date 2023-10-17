from api.graphql.types.address.serializers import AddressSerializer
from applications.models import Organisation
from common.serializers import TranslatedModelSerializer


class OrganisationSerializer(TranslatedModelSerializer):
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
