from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationRound


__all__ = [
    "ApplicationRoundValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ApplicationRoundValidator:
    application_round: ApplicationRound

    def validate_open_for_applications(self) -> None:
        begin = self.application_round.application_period_begin.astimezone(DEFAULT_TIMEZONE)
        end = self.application_round.application_period_end.astimezone(DEFAULT_TIMEZONE)
        now = local_datetime()

        if begin < now <= end:
            return

        msg = "Application round is not open for applications"
        raise ValidationError(msg)
