from rest_framework import permissions


class WebhookPermission(permissions.BasePermission):
    def has_object_permission(self, request, view, reservation_unit):
        return True

    def has_permission(self, request, view):
        return request.method == "POST"
