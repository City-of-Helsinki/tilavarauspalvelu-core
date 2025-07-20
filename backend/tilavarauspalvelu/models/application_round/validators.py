from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from graphql.pyutils import Path
from undine.exceptions import GraphQLValidationError

from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationRound


__all__ = [
    "ApplicationRoundValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ApplicationRoundValidator:
    application_round: ApplicationRound

    def validate_open_for_applications(self, path: Path | None = None) -> None:
        begin = self.application_round.application_period_begins_at.astimezone(DEFAULT_TIMEZONE)
        end = self.application_round.application_period_ends_at.astimezone(DEFAULT_TIMEZONE)
        now = local_datetime()

        if begin < now <= end:
            return

        msg = "Application round is not open for applications"
        raise GraphQLValidationError(msg, path=path.as_list() if path else None)
