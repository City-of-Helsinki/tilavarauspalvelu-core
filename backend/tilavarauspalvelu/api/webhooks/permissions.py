from __future__ import annotations

from typing import TYPE_CHECKING, Any

from rest_framework import permissions

if TYPE_CHECKING:
    from rest_framework.request import Request
    from rest_framework.views import APIView


class WebhookPermission(permissions.BasePermission):
    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        return True

    def has_permission(self, request: Request, view: APIView) -> bool:
        return request.method == "POST"
