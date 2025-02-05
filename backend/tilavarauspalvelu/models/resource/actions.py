from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Resource


class ResourceActions:
    def __init__(self, resource: Resource) -> None:
        self.resource = resource
