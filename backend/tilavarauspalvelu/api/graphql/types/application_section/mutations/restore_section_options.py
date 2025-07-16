from __future__ import annotations

from tilavarauspalvelu.api.graphql.types.application_section.mutations import (
    RestoreAllSectionOptionsSerializer,
    UpdateAllSectionOptionsPermission,
)


class RestoreAllSectionOptionsMutation(UpdateMutation):
    class Meta:
        serializer_class = RestoreAllSectionOptionsSerializer
        permission_classes = [UpdateAllSectionOptionsPermission]
