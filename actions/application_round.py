from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from applications.models import ApplicationRound


class ApplicationRoundActions:
    def __init__(self, application_round: "ApplicationRound") -> None:
        self.application_round = application_round
