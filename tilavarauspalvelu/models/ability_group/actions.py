from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import AbilityGroup


class AbilityGroupActions:
    def __init__(self, ability_group: "AbilityGroup") -> None:
        self.ability_group = ability_group
