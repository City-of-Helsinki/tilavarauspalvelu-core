from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib import admin

if TYPE_CHECKING:
    from django.db import models
    from django.urls import path

    from tilavarauspalvelu.typing import WSGIRequest


class ImmutableModelAdmin(admin.ModelAdmin):
    """Base class for admin.ModelAdmin classes that should not allow adding, changing or deleting objects."""

    def has_add_permission(self, request: WSGIRequest) -> bool:
        return False

    def has_change_permission(self, request: WSGIRequest, obj: models.Model | None = None) -> bool:
        return False

    def has_delete_permission(self, request: WSGIRequest, obj: models.Model = None) -> bool:
        return False

    def get_urls(self) -> list[path]:
        urls = super().get_urls()
        urls.pop(1)  # Remove the /add/ view URL
        urls.pop(2)  # Remove the /delete/ view URL
        return urls
