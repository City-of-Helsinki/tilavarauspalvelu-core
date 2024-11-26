from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import Organisation

from .permissions import OrganisationPermission


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
