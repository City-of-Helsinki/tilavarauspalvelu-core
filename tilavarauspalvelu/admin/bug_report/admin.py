from __future__ import annotations

from django import forms
from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from import_export.admin import ExportMixin
from import_export.formats.base_formats import CSV

from tilavarauspalvelu.models import BugReport


class BugReportAdminForm(forms.ModelForm):
    class Meta:
        model = BugReport
        fields = []  # Use fields from ModelAdmin
        labels = {
            "name": _("Name"),
            "description": _("Description"),
            "release": _("GitHub release"),
            "jira_ticket_url": _("Jira ticket URL"),
            "github_pr_url": _("GitHub PR URL"),
            "target": _("Target application"),
            "priority": _("Fix priority"),
            "fix_strategy": _("Fix strategy"),
            "found_in_phase": _("Phase"),
            "was_real_issue": _("Real issue?"),
            "found_by": _("Found by"),
            "found_at": _("Found at"),
            "fixed_by": _("Fixed by"),
            "fixed_at": _("Fixed at"),
            "created_at": _("Created at"),
            "updated_at": _("Updated at"),
        }
        help_texts = {
            "name": _("Name of the bug report"),
            "description": _("Description for the bug report"),
            "release": _("GitHub release tag"),
            "jira_ticket_url": _("Jira ticket URL"),
            "github_pr_url": _("GitHub PR URL"),
            "target": _("Which application was the bug found in?"),
            "priority": _("How urgently should this bug be fixed?"),
            "fix_strategy": _("In which way could this bug have been caught?"),
            "found_in_phase": _("Phase in which the bug was found"),
            "was_real_issue": _("Was this a real issue or e.g. broken test?"),
            "found_by": _("Who found the bug?"),
            "found_at": _("When was the bug found?"),
            "fixed_by": _("Who fixed the bug?"),
            "fixed_at": _("When was the bug fixed?"),
            "created_at": _("When was the bug report created?"),
            "updated_at": _("When was the bug report updated?"),
        }


@admin.register(BugReport)
class BugReportAdmin(ExportMixin, admin.ModelAdmin):
    # Functions
    search_fields = [
        "name",
        "description",
        "jira_ticket_url",
        "github_pr_url",
    ]
    search_help_text = _("Search by name, description, Jira ticket URL or GitHub PR URL")
    formats = [CSV]

    # List
    list_display = [
        "name",
        "release",
        "priority",
        "found_at",
        "fixed_at",
    ]
    list_filter = [
        "target",
        "priority",
        "fix_strategy",
        "found_in_phase",
        "was_real_issue",
        "found_by",
        "fixed_by",
        "release",
    ]

    # Form
    form = BugReportAdminForm
    fields = [
        "name",
        "description",
        "release",
        "jira_ticket_url",
        "github_pr_url",
        "target",
        "priority",
        "found_in_phase",
        "fix_strategy",
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
