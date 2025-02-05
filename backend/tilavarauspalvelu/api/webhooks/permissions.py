from __future__ import annotations

from rest_framework import permissions


class WebhookPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, obj) -> bool:
        return True

    def has_permission(self, request, view) -> bool:
        return request.method == "POST"
