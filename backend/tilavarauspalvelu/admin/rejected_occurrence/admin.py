from __future__ import annotations

from typing import TYPE_CHECKING

from django.contrib import admin

from tilavarauspalvelu.models import RejectedOccurrence

if TYPE_CHECKING:
    from django.db.models import QuerySet

    from tilavarauspalvelu.typing import WSGIRequest


__all__ = [
    "RejectedOccurrenceAdmin",
]


@admin.register(RejectedOccurrence)
class RejectedOccurrenceAdmin(admin.ModelAdmin):
    # Functions
    search_fields = [
        "rejection_reason",
        "reservation_series__name",
    ]
    search_help_text = "Search by rejection reason or reservation series' name"

    # List
    list_display = [
        "id",
        "begin_datetime",
        "end_datetime",
        "rejection_reason",
        "reservation_series",
    ]
    ordering = [
        "-id",
        "reservation_series",
    ]

    # Form
    fields = [
        "reservation_series",
        "created_at",
        "begin_datetime",
        "end_datetime",
        "rejection_reason",
    ]
    readonly_fields = [
        "created_at",
        "reservation_series",
    ]

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return super().get_queryset(request).select_related("reservation_series")
