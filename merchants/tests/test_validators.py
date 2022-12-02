from assertpy import assert_that
from django.core.exceptions import ValidationError
from django.test import TestCase
from pytest import raises

from ..validators import is_numeric, validate_accounting_project


class ValidatorTestCase(TestCase):
    def test_is_numeric(self):
        is_numeric("")
        is_numeric("12356")
        is_numeric("00000")

        with raises(ValidationError):
            assert_that(is_numeric("A2356")).is_false

        with raises(ValidationError):
            assert_that(is_numeric("12A56")).is_false

        with raises(ValidationError):
            assert_that(is_numeric("12A56")).is_false

        with raises(ValidationError):
            assert_that(is_numeric("12356⁰")).is_false

    def validate_accounting_project(self):
        validate_accounting_project("1234567")
        validate_accounting_project("1234567890")
        validate_accounting_project("123456789012")
        validate_accounting_project("12345678901234")
        validate_accounting_project("1234567890123456")

        with raises(ValidationError):
            validate_accounting_project("123456")
        with raises(ValidationError):
            validate_accounting_project("12345678")
        with raises(ValidationError):
            validate_accounting_project("1234567890123")
        with raises(ValidationError):
            validate_accounting_project("123456789012345")
        with raises(ValidationError):
            validate_accounting_project("12345678901234567")
