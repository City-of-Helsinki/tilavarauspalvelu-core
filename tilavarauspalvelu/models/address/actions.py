from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import Address


class AddressActions:
    def __init__(self, address: "Address") -> None:
        self.address = address
