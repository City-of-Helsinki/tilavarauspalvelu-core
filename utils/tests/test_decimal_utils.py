from decimal import Decimal

from assertpy import assert_that
from django.test import TestCase

from utils.decimal_utils import round_decimal


class DecimalUtilsTestCase(TestCase):
    def test_round_decimal(self):
        assert_that(round_decimal(Decimal("1"), 2)).is_equal_to(Decimal("1.00"))
        assert_that(round_decimal(Decimal("1"), 5)).is_equal_to(Decimal("1.000000"))
        assert_that(round_decimal(Decimal("1.00"), 3)).is_equal_to(Decimal("1.000"))
        assert_that(round_decimal(Decimal("1.432"), 2)).is_equal_to(Decimal("1.43"))
        assert_that(round_decimal(Decimal("1.435"), 2)).is_equal_to(Decimal("1.44"))
        assert_that(round_decimal(Decimal("1.439"), 2)).is_equal_to(Decimal("1.44"))
        assert_that(round_decimal(Decimal("1.443"), 2)).is_equal_to(Decimal("1.44"))
        assert_that(round_decimal(Decimal("1.445"), 2)).is_equal_to(Decimal("1.45"))
        assert_that(round_decimal(Decimal("1.449"), 2)).is_equal_to(Decimal("1.45"))
        assert_that(round_decimal(Decimal("1354.55"), 0)).is_equal_to(Decimal("1355"))
