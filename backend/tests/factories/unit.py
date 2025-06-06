from __future__ import annotations

from typing import Self

import factory
from factory import LazyAttribute

from tilavarauspalvelu.models import Unit

from ._base import (
    FakerEN,
    FakerFI,
    FakerSV,
    ForeignKeyFactory,
    GenericDjangoModelFactory,
    ManyToManyFactory,
    ModelFactoryBuilder,
    ReverseForeignKeyFactory,
)

__all__ = [
    "UnitBuilder",
    "UnitFactory",
]


class UnitFactory(GenericDjangoModelFactory[Unit]):
    class Meta:
        model = Unit

    tprek_id = None  # str
    tprek_department_id = None  # str
    tprek_last_modified = None  # datetime.datetime

    name = FakerFI("word")
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    description = FakerFI("text")
    description_fi = LazyAttribute(lambda i: i.description)
    description_en = FakerEN("text")
    description_sv = FakerSV("text")

    short_description = FakerFI("text")
    short_description_fi = LazyAttribute(lambda i: i.description)
    short_description_en = FakerEN("text")
    short_description_sv = FakerSV("text")

    search_terms = LazyAttribute(lambda i: [])

    web_page = ""
    email = ""
    phone = ""

    rank = factory.Sequence(lambda i: i)

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

    allow_permissions_from_ad_groups = False

    origin_hauki_resource = ForeignKeyFactory("tests.factories.OriginHaukiResourceFactory")
    payment_merchant = ForeignKeyFactory("tests.factories.PaymentMerchantFactory")
    payment_accounting = ForeignKeyFactory("tests.factories.PaymentAccountingFactory")

    reservation_units = ReverseForeignKeyFactory("tests.factories.ReservationUnitFactory")
    spaces = ReverseForeignKeyFactory("tests.factories.SpaceFactory")

    unit_roles = ManyToManyFactory("tests.factories.UnitRoleFactory")
    unit_groups = ManyToManyFactory("tests.factories.UnitGroupFactory")


class UnitBuilder(ModelFactoryBuilder[Unit]):
    factory = UnitFactory

    def with_hauki_resource(self) -> Self:
        return self.set(
            origin_hauki_resource__latest_fetched_date=None,
        )
