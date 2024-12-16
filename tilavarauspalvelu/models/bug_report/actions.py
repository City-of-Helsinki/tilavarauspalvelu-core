from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import BugReport

__all__ = [
    "BugReportActions",
]


class BugReportActions:
    def __init__(self, bug_report: BugReport) -> None:
        self.bug_report = bug_report
