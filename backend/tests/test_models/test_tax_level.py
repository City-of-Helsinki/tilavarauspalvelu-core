from __future__ import annotations

import datetime
from decimal import Decimal

import pytest
from django.db import IntegrityError

from tilavarauspalvelu.exceptions import TaxLevelHasNoRateError

from tests.factories import TaxLevelFactory, TaxLevelRateFactory
from tests.helpers import exact

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_tax_level__get_percentage():
    tax_level = TaxLevelFactory.create(rates__percentage=Decimal(24), rates__begins=datetime.date(2024, 1, 1))
    TaxLevelRateFactory.create(tax_level=tax_level, begins=datetime.date(2024, 9, 1), percentage=Decimal("25.5"))

    assert tax_level.actions.get_percentage(on_date=datetime.date(2024, 1, 1)) == Decimal(24)
    assert tax_level.actions.get_percentage(on_date=datetime.date(2024, 8, 31)) == Decimal(24)
    assert tax_level.actions.get_percentage(on_date=datetime.date(2024, 9, 1)) == Decimal("25.5")
    assert tax_level.actions.get_percentage(on_date=datetime.date(2030, 1, 1)) == Decimal("25.5")


def test_tax_level__get_percentage__no_rate_in_effect():
    tax_level = TaxLevelFactory.create(name="Yleinen", rates__begins=datetime.date(2024, 1, 1))

    msg = "Tax level 'Yleinen' has no rate on 2023-12-31"
    with pytest.raises(TaxLevelHasNoRateError, match=exact(msg)):
        tax_level.actions.get_percentage(on_date=datetime.date(2023, 12, 31))


def test_tax_level__name_is_unique():
    TaxLevelFactory.create(name="Yleinen")

    with pytest.raises(IntegrityError):
        TaxLevelFactory.create(name="Yleinen")
