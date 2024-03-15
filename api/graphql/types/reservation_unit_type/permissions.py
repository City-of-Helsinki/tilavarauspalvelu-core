from graphene_django_extensions.permissions import BasePermission
from graphene_django_extensions.typing import AnyUser


class ReservationUnitTypePermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True
