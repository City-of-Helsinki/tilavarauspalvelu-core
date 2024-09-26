from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Organisation


class OrganisationActions:
    def __init__(self, organisation: "Organisation") -> None:
        self.organisation = organisation
