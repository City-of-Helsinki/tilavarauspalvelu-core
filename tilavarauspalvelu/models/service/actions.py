from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Service


class ServiceActions:
    def __init__(self, service: "Service") -> None:
        self.service = service
