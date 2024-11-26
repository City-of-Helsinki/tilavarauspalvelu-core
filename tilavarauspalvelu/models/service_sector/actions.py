from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ServiceSector


class ServiceSectorActions:
    def __init__(self, service_sector: ServiceSector) -> None:
        self.service_sector = service_sector
