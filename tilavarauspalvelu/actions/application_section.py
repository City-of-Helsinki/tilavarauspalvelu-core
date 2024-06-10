from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from applications.models import ApplicationSection


class ApplicationSectionActions:
    def __init__(self, application_section: ApplicationSection) -> None:
        self.application_section = application_section
