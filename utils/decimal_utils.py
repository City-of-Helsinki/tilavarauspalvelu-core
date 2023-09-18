from decimal import ROUND_HALF_UP, Decimal


def round_decimal(decimal: Decimal, ndigits: int) -> Decimal:
    exp = Decimal(f"1.{'0' * ndigits}") if ndigits > 1 else Decimal("1")
    return decimal.quantize(exp, rounding=ROUND_HALF_UP)
