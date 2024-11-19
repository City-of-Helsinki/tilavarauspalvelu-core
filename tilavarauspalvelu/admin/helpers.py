from django.contrib import admin
from django.db import models

from tilavarauspalvelu.typing import WSGIRequest


class ImmutableModelAdmin(admin.ModelAdmin):
    """Base class for admin.ModelAdmin classes that should not allow adding, changing or deleting objects."""

    def has_add_permission(self, request: WSGIRequest) -> bool:
        return False

    def has_change_permission(self, request: WSGIRequest, obj: models.Model | None = None) -> bool:
        return False

    def has_delete_permission(self, request, obj=None) -> bool:
        return False

    def get_urls(self):
        urls = super().get_urls()
        urls.pop(1)  # Remove the /add/ view URL
        urls.pop(2)  # Remove the /delete/ view URL
        return urls
