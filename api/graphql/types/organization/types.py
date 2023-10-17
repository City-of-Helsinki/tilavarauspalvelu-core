from api.graphql.extensions.base_types import DjangoAuthNode
from api.graphql.types.organization.permissions import OrganisationPermission
from applications.models import Organisation


class OrganisationNode(DjangoAuthNode):
    class Meta:
        model = Organisation
        fields = [
            "pk",
            "name",
            "identifier",
            "year_established",
            "active_members",
            "organisation_type",
            "core_business",
            "email",
            "address",
        ]
        permission_classes = (OrganisationPermission,)
