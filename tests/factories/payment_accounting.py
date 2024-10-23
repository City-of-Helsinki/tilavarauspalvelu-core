from tilavarauspalvelu.models import PaymentAccounting

from ._base import FakerFI, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "PaymentAccountingFactory",
]


class PaymentAccountingFactory(GenericDjangoModelFactory[PaymentAccounting]):
    class Meta:
        model = PaymentAccounting
        django_get_or_create = ["name"]

    name = FakerFI("company", unique=True)
    company_code = "1234"
    main_ledger_account = "123456"
    vat_code = "AB"
    internal_order = "1234567890"
    profit_center = "1234567"
    project = "1234567"
    operation_area = "123456"
    balance_profit_center = "2983300"

    reservation_units = ReverseForeignKeyFactory("tests.factories.ReservationUnitFactory")
    units = ReverseForeignKeyFactory("tests.factories.UnitFactory")
