from assertpy import assert_that
from django.test import TestCase

from elastic_django.reservation_units.query_builder import (
    ReservationUnitQueryBuilderMixin,
)


class ReservationUnitQueryBuilderTestCase(TestCase):
    def test_parse_search_word_when_one_search_word(self):
        query_str = ReservationUnitQueryBuilderMixin.build_elastic_query_str("search")

        assert_that(query_str).is_equal_to("(*search*)")

    def test_parse_search_word_when_two_search_word(self):
        query_str = ReservationUnitQueryBuilderMixin.build_elastic_query_str("search this")

        assert_that(query_str).is_equal_to("((*search) AND (this*))")

    def test_parse_search_word_when_three_search_word(self):
        query_str = ReservationUnitQueryBuilderMixin.build_elastic_query_str("search this too")

        assert_that(query_str).is_equal_to("((*search) AND (this) AND (too*))")

    def test_parse_search_word_when_four_search_word(self):
        query_str = ReservationUnitQueryBuilderMixin.build_elastic_query_str("search this too much")

        assert_that(query_str).is_equal_to("((*search) AND (this) AND (too) AND (much*))")

    def test_parse_search_word_when_comma_separated_search(self):
        query_str = ReservationUnitQueryBuilderMixin.build_elastic_query_str("search, this, too, much")

        assert_that(query_str).is_equal_to("(*search*) OR (*this*) OR (*too*) OR (*much*)")

    def test_parse_search_word_when_comma_separated_search_with_multiple_words(self):
        query_str = ReservationUnitQueryBuilderMixin.build_elastic_query_str("search this, too, much")

        assert_that(query_str).is_equal_to("((*search) AND (this*)) OR (*too*) OR (*much*)")
