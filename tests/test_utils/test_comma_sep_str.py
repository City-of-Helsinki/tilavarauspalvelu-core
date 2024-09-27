import pytest

from utils.utils import comma_sep_str


@pytest.mark.parametrize(
    ("values", "result"),
    [
        (["foo", "bar", "baz"], "foo, bar & baz"),
        (["foo", "bar"], "foo & bar"),
        (["foo"], "foo"),
        ([""], ""),
        ([], ""),
        ([1, 2, 3], "1, 2 & 3"),
        ((i for i in ["foo", "bar", "baz"]), "foo, bar & baz"),
    ],
)
def test_comma_sep_str(values, result):
    assert comma_sep_str(values) == result
