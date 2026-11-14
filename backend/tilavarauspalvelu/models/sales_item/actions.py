import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import SalesItem


__all__ = [
    "SalesItemActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class SalesItemActions:
    sales_item: SalesItem
