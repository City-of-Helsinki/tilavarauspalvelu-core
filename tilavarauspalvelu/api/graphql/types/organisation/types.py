from graphene_django_extensions import DjangoNode

from applications.models import Organisation
from tilavarauspalvelu.api.graphql.types.organisation.permissions import OrganisationPermission


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
