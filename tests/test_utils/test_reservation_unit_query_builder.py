from elastic_django.reservation_units.query_builder import ReservationUnitQueryBuilderMixin


def test_parse_search_word_when_one_search_word():
    query_str = ReservationUnitQueryBuilderMixin.build_elastic_query_str("search")
    assert query_str == "(*search*)"


def test_parse_search_word_when_two_search_word():
    query_str = ReservationUnitQueryBuilderMixin.build_elastic_query_str("search this")
    assert query_str == "((*search) AND (this*))"


def test_parse_search_word_when_three_search_word():
    query_str = ReservationUnitQueryBuilderMixin.build_elastic_query_str("search this too")
    assert query_str == "((*search) AND (this) AND (too*))"


def test_parse_search_word_when_four_search_word():
    query_str = ReservationUnitQueryBuilderMixin.build_elastic_query_str("search this too much")
    assert query_str == "((*search) AND (this) AND (too) AND (much*))"


def test_parse_search_word_when_comma_separated_search():
    query_str = ReservationUnitQueryBuilderMixin.build_elastic_query_str("search, this, too, much")
    assert query_str == "(*search*) OR (*this*) OR (*too*) OR (*much*)"


def test_parse_search_word_when_comma_separated_search_with_multiple_words():
    query_str = ReservationUnitQueryBuilderMixin.build_elastic_query_str("search this, too, much")
    assert query_str == "((*search) AND (this*)) OR (*too*) OR (*much*)"
