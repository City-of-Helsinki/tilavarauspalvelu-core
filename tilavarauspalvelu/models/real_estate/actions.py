from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import RealEstate


class RealEstateActions:
    def __init__(self, real_estate: "RealEstate") -> None:
        self.real_estate = real_estate
