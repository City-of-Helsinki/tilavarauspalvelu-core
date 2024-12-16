from __future__ import annotations

from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from tilavarauspalvelu.models import BugReport


@admin.register(BugReport)
class BugReportAdmin(admin.ModelAdmin):
    # Functions
    search_fields = [
        "name",
        "description",
    ]
    search_help_text = _("Search by name or description")

    # List
    list_display = [
        "name",
        "found_at",
        "fixed_at",
    ]
    list_filter = [
        "phase",
        "was_real_issue",
        "found_by",
        "fixed_by",
    ]

    # Form
    fields = [
        "name",
        "description",
        "phase",
        "was_real_issue",
        "found_by",
        "found_at",
        "fixed_by",
        "fixed_at",
        "created_at",
        "updated_at",
    ]
    readonly_fields = [
        "created_at",
        "updated_at",
    ]
