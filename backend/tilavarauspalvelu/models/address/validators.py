from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Address


__all__ = [
    "AddressValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class AddressValidator:
    address: Address
