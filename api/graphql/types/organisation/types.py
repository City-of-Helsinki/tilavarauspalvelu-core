from graphene_django_extensions import DjangoNode

from api.graphql.types.organisation.permissions import OrganisationPermission
from applications.models import Organisation


class OrganisationNode(DjangoNode):
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
        permission_classes = [OrganisationPermission]
