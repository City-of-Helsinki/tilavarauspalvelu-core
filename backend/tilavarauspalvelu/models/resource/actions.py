from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Resource


__all__ = [
    "ResourceActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ResourceActions:
    resource: Resource
