from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import User


class UserActions:
    def __init__(self, user: User) -> None:
        self.user = user
