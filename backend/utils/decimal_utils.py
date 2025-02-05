from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal


def round_decimal(value: Decimal, precision: int) -> Decimal:
    """
    Round Decimal to given precision.

    This method should be used instead of round(Decimal) because round() uses ROUND_HALF_EVEN rounding mode.
    """
    if precision <= 0:
        return value.quantize(Decimal(1), rounding=ROUND_HALF_UP)
    return value.quantize(Decimal("1." + "0" * precision), rounding=ROUND_HALF_UP)
