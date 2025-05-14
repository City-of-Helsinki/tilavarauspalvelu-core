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
        "recurring_reservation__name",
    ]
    search_help_text = "Search by rejection reason or recurring reservation's name"

    # List
    list_display = [
        "id",
        "begin_datetime",
        "end_datetime",
        "rejection_reason",
        "recurring_reservation",
    ]
    ordering = [
        "-id",
        "recurring_reservation",
    ]

    # Form
    fields = [
        "recurring_reservation",
        "created_at",
        "begin_datetime",
        "end_datetime",
        "rejection_reason",
    ]
    readonly_fields = [
        "created_at",
        "recurring_reservation",
    ]

    def get_queryset(self, request: WSGIRequest) -> QuerySet:
        return super().get_queryset(request).select_related("recurring_reservation")
