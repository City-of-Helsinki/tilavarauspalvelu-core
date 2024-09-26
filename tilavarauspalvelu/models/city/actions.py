from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import City


class CityActions:
    def __init__(self, city: "City") -> None:
        self.city = city
