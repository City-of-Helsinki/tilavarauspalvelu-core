from __future__ import annotations

from factory import LazyAttribute

from tilavarauspalvelu.models import Location

from ._base import FakerEN, FakerFI, FakerSV, ForwardOneToOneFactory, GenericDjangoModelFactory

__all__ = [
    "LocationFactory",
]


class LocationFactory(GenericDjangoModelFactory[Location]):
    class Meta:
        model = Location

    address_street = FakerFI("street_address")
    address_street_fi = LazyAttribute(lambda i: i.address_street)
    address_street_en = FakerEN("street_address")
    address_street_sv = FakerSV("street_address")

    address_zip = FakerFI("postcode")

    address_city = FakerFI("city")
    address_city_fi = LazyAttribute(lambda i: i.address_city)
    address_city_en = FakerEN("city")
    address_city_sv = FakerSV("city")

    coordinates = None  # `django.contrib.gis.geos.Point`

    space = ForwardOneToOneFactory("tests.factories.SpaceFactory")
    building = ForwardOneToOneFactory("tests.factories.BuildingFactory")
    real_estate = ForwardOneToOneFactory("tests.factories.RealEstateFactory")
    unit = ForwardOneToOneFactory("tests.factories.UnitFactory")
