from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .actions import BugReportActions
from .queryset import BugReportManager

if TYPE_CHECKING:
    import datetime

__all__ = [
    "BugReport",
]


class BugReportUserChoice(models.TextChoices):
    # Known users
    EEMELI = "Eemeli"
    JESSE = "Jesse"
    JOONATAN = "Joonatan"
    JUSA = "Jusa"
    MATTI = "Matti"
    MATU = "Matu"
    MILLA = "Milla"
    OIVA = "Oiva"
    RISTO = "Risto"
    # Unknown users
    OTHER = "Other", _("Someone else, who?")


class BugReportPhaseChoice(models.TextChoices):
    PULL_REQUEST = "Pull Request"
    ROBOT = "Robot"
    MANUAL_TESTING = "Manual Testing"
    PRODUCTION = "Production"


class BugReportTargetChoice(models.TextChoices):
    BACKEND = "Backend"
    FRONTEND = "Frontend"
    ROBOT = "Robot"


class BugReportPriorityChoice(models.TextChoices):
    THIS_SPRINT = "This Sprint"
    NEXT_SPRINT = "Next Sprint"
    BACKLOG = "Backlog"


class BugReportFixStrategyChoice(models.TextChoices):
    SPECIFICATION = "Specification"
    LINTER = "Linter"
    AUTOMATED_TESTING = "Automated Testing"
    MANUAL_REVIEW = "Manual Review"
    ROBOT = "Robot"
    OTHER = "Other", _("Something else, what?")


class BugReport(models.Model):
    name: str = models.CharField(max_length=255)
    description: str = models.TextField(blank=True, default="")

    release: str = models.CharField(max_length=255, blank=True, default="")
    jira_ticket_url: str = models.URLField(max_length=255, blank=True, default="")
    github_pr_url: str = models.URLField(max_length=255, blank=True, default="")

    target: str = models.CharField(max_length=255, choices=BugReportTargetChoice.choices)
    priority: str = models.CharField(max_length=255, choices=BugReportPriorityChoice.choices)

    found_in_phase: str = models.CharField(max_length=255, choices=BugReportPhaseChoice.choices)
    fix_strategy: str | None = models.CharField(
        max_length=255,
        choices=BugReportFixStrategyChoice.choices,
        null=True,
        blank=True,
    )

    was_real_issue: bool = models.BooleanField(default=True)

    found_by: str = models.CharField(max_length=255, choices=BugReportUserChoice.choices)
    found_at: datetime.datetime = models.DateTimeField()

    fixed_by: str | None = models.CharField(max_length=255, choices=BugReportUserChoice.choices, null=True, blank=True)
    fixed_at: datetime.datetime | None = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = BugReportManager()

    class Meta:
        db_table = "bug_report"
        base_manager_name = "objects"
        verbose_name = _("bug report")
        verbose_name_plural = _("bug reports")
        ordering = ["pk"]
        constraints = [
            models.CheckConstraint(
                check=(
                    (models.Q(fixed_by__isnull=True) & models.Q(fixed_at__isnull=True))
                    | (models.Q(fixed_by__isnull=False) & models.Q(fixed_at__isnull=False))
                ),
                name="must_set_both_fixed_by_and_fixed_at_together",
                violation_error_message="Bug report fixed by and fixed at must be set together.",
            ),
        ]

    def __str__(self) -> str:
        return f"{str(_('bug report')).capitalize()} {self.pk}: {self.name}"

    @cached_property
    def actions(self) -> BugReportActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        return BugReportActions(self)
