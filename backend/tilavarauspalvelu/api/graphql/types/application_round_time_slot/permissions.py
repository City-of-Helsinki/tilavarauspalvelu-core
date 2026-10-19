from __future__ import annotations

from graphene_django_extensions.permissions import BasePermission

from tilavarauspalvelu.models import ApplicationRoundTimeSlot
from tilavarauspalvelu.typing import AnyUser


class ApplicationRoundTimeSlotPermission(BasePermission[ApplicationRoundTimeSlot, AnyUser]):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True
