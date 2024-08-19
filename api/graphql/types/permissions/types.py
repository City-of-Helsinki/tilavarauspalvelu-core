from graphene_django_extensions import DjangoNode

from permissions.models import GeneralRole, UnitRole

__all__ = [
    "GeneralRoleNode",
    "UnitRoleNode",
]


class GeneralRoleNode(DjangoNode):
    class Meta:
        model = GeneralRole
        fields = [
            "user",
            "role",
            "assigner",
            "created",
            "modified",
        ]


class UnitRoleNode(DjangoNode):
    class Meta:
        model = UnitRole
        fields = [
            "user",
            "role",
            "units",
            "unit_groups",
            "assigner",
            "created",
            "modified",
        ]
