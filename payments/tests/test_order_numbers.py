from assertpy import assert_that

from ..order_numbers import generate_order_number


def test_generated_order_number_is_a_string():
    order_number = generate_order_number()
    assert_that(order_number).is_instance_of(str)


def test_order_numbers_generated_with_the_same_time_are_equal():
    order_number1 = generate_order_number(0)
    order_number2 = generate_order_number(0)
    assert_that(order_number1).is_equal_to(order_number2)


def test_order_numbers_generated_with_different_times_are_not_equal():
    order_number1 = generate_order_number(0)
    order_number2 = generate_order_number(1)
    assert_that(order_number1).is_not_equal_to(order_number2)
