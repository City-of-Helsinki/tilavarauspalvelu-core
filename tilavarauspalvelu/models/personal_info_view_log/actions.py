from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import PersonalInfoViewLog


class PersonalInfoViewLogActions:
    def __init__(self, personal_info_view_log: PersonalInfoViewLog) -> None:
        self.personal_info_view_log = personal_info_view_log
