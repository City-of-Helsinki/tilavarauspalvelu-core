from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Address


__all__ = [
    "AddressActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class AddressActions:
    address: Address
