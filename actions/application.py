from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from applications.models import Application


class ApplicationActions:
    def __init__(self, application: "Application") -> None:
        self.application = application
