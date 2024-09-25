from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Purpose


class PurposeActions:
    def __init__(self, purpose: "Purpose") -> None:
        self.purpose = purpose
