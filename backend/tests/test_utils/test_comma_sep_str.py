from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from utils.utils import comma_sep_str

if TYPE_CHECKING:
    from collections.abc import Iterable


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
def test_comma_sep_str(values: Iterable[str | int], result: str) -> None:
    assert comma_sep_str(values) == result
