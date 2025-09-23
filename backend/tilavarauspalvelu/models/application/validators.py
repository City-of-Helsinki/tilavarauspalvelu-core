from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from django.conf import settings
from django.core.exceptions import ValidationError

from tilavarauspalvelu.typing import error_codes

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Application


__all__ = [
    "ApplicationValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ApplicationValidator:
    application: Application

    @classmethod
    def validate_not_too_many_sections(cls, section_count: int) -> None:
        if section_count > settings.MAXIMUM_SECTIONS_PER_APPLICATION:
            msg = (
                f"Cannot create more than {settings.MAXIMUM_SECTIONS_PER_APPLICATION} "
                f"application sections in one application"
            )
            raise ValidationError(msg, code=error_codes.APPLICATION_SECTIONS_MAXIMUM_EXCEEDED)
