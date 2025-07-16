from __future__ import annotations

from tilavarauspalvelu.api.graphql.types.application_section.mutations import (
    RejectAllSectionOptionsSerializer,
    UpdateAllSectionOptionsPermission,
)


class RejectAllSectionOptionsMutation(UpdateMutation):
    class Meta:
        serializer_class = RejectAllSectionOptionsSerializer
        permission_classes = [UpdateAllSectionOptionsPermission]
