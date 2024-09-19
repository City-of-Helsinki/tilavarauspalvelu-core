from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import EmailTemplate


class EmailTemplateActions:
    def __init__(self, email_template: "EmailTemplate") -> None:
        self.email_template = email_template
