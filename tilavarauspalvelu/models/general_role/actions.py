from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import GeneralRole


class GeneralRoleActions:
    def __init__(self, general_role: "GeneralRole") -> None:
        self.general_role = general_role
