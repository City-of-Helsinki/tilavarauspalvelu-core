from decimal import Decimal

from django.test import TestCase

from utils.decimal_utils import round_decimal


class DecimalUtilsTestCase(TestCase):
    def test_round_decimal(self):
        assert round_decimal(Decimal("1"), 2) == Decimal("1.00")
        assert round_decimal(Decimal("1"), 5) == Decimal("1.000000")
        assert round_decimal(Decimal("1.00"), 3) == Decimal("1.000")
        assert round_decimal(Decimal("1.432"), 2) == Decimal("1.43")
        assert round_decimal(Decimal("1.435"), 2) == Decimal("1.44")
        assert round_decimal(Decimal("1.439"), 2) == Decimal("1.44")
        assert round_decimal(Decimal("1.443"), 2) == Decimal("1.44")
        assert round_decimal(Decimal("1.445"), 2) == Decimal("1.45")
        assert round_decimal(Decimal("1.449"), 2) == Decimal("1.45")
        assert round_decimal(Decimal("1354.55"), 0) == Decimal("1355")
