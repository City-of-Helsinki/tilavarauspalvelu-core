from elastic_django.reservation_units.query_builder import build_elastic_query_str


def test_build_elastic_query_str__one_search_word():
    query_str = build_elastic_query_str("search")
    assert query_str == "(*search*)"


def test_build_elastic_query_str__two_search_word():
    query_str = build_elastic_query_str("search this")
    assert query_str == "((*search) AND (this*))"


def test_build_elastic_query_str__three_search_word():
    query_str = build_elastic_query_str("search this too")
    assert query_str == "((*search) AND (this) AND (too*))"


def test_build_elastic_query_str__four_search_word():
    query_str = build_elastic_query_str("search this too much")
    assert query_str == "((*search) AND (this) AND (too) AND (much*))"


def test_build_elastic_query_str__comma_separated_search():
    query_str = build_elastic_query_str("search, this, too, much")
    assert query_str == "(*search*) OR (*this*) OR (*too*) OR (*much*)"


def test_build_elastic_query_str__comma_separated_search_with_multiple_words():
    query_str = build_elastic_query_str("search this, too, much")
    assert query_str == "((*search) AND (this*)) OR (*too*) OR (*much*)"


def test_build_elastic_query_str__two_search_words__with_multiple_spaces():
    query_str = build_elastic_query_str("search   this  ")
    assert query_str == "((*search) AND (this*))"


def test_build_elastic_query_str__two_search_words__with_multiple_commas():
    query_str = build_elastic_query_str("search, ,, this ,")
    assert query_str == "(*search*) OR (*this*)"
