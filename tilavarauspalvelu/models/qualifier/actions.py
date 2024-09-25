from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Qualifier


class QualifierActions:
    def __init__(self, qualifier: "Qualifier") -> None:
        self.qualifier = qualifier
