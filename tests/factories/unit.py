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
    ReverseForeignKeyFactory,
    ReverseOneToOneFactory,
)

__all__ = [
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

    web_page = ""
    email = ""
    phone = ""

    rank = factory.Sequence(lambda i: i)

    origin_hauki_resource = ForeignKeyFactory("tests.factories.OriginHaukiResourceFactory")
    payment_merchant = ForeignKeyFactory("tests.factories.PaymentMerchantFactory")
    payment_accounting = ForeignKeyFactory("tests.factories.PaymentAccountingFactory")

    location = ReverseOneToOneFactory("tests.factories.LocationFactory")

    reservation_units = ReverseForeignKeyFactory("tests.factories.ReservationUnitFactory")

    unit_roles = ManyToManyFactory("tests.factories.UnitRoleFactory")
    service_sectors = ManyToManyFactory("tests.factories.ServiceSectorFactory")
    unit_groups = ManyToManyFactory("tests.factories.UnitGroupFactory")
