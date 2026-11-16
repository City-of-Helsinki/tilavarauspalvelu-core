from __future__ import annotations

from graphene_django_extensions import DjangoNode

from tilavarauspalvelu.models import ParticipantGender

from .filtersets import ParticipantGenderFilterSet
from .permissions import ParticipantGenderPermission

__all__ = [
    "ParticipantGenderNode",
]


class ParticipantGenderNode(DjangoNode):
    class Meta:
        model = ParticipantGender
        fields = [
            "pk",
            "rank",
            "name",
        ]
        filterset_class = ParticipantGenderFilterSet
        permission_classes = [ParticipantGenderPermission]
