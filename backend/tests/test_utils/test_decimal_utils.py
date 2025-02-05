from __future__ import annotations

from decimal import Decimal

import pytest

from utils.decimal_utils import round_decimal


@pytest.mark.parametrize(
    ("value", "places", "expected"),
    [
        (Decimal(1), 2, Decimal("1.00")),
        (Decimal(1), 5, Decimal("1.000000")),
        (Decimal("1.00"), 3, Decimal("1.000")),
        (Decimal("1.432"), 2, Decimal("1.43")),
        (Decimal("1.435"), 2, Decimal("1.44")),
        (Decimal("1.439"), 2, Decimal("1.44")),
        (Decimal("1.443"), 2, Decimal("1.44")),
        (Decimal("1.445"), 2, Decimal("1.45")),
    ],
)
def test_round_decimal(value, places, expected):
    assert round_decimal(value, places) == expected
