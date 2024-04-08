from typing import Any, NamedTuple

import pytest
from graphene_django_extensions.testing.utils import parametrize_helper

from common.utils import get_nested

Sentinel = object()


class Params(NamedTuple):
    value: dict | list | None
    args: list[str | int]
    default: Any
    expected: Any


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "One layer dict": Params(
                value={"foo": 1},
                args=["foo"],
                default=Sentinel,
                expected=1,
            ),
            "Two layer dict": Params(
                value={"foo": {"bar": 1}},
                args=["foo", "bar"],
                default=Sentinel,
                expected=1,
            ),
            "Three layer dict": Params(
                value={"foo": {"bar": {"baz": 1}}},
                args=["foo", "bar", "baz"],
                default=Sentinel,
                expected=1,
            ),
            "One layer list": Params(
                value=[1, 2],
                args=[0],
                default=Sentinel,
                expected=1,
            ),
            "Two layer list": Params(
                value=[[1, 2]],
                args=[0, 0],
                default=Sentinel,
                expected=1,
            ),
            "Three layer list": Params(
                value=[[[1, 2]]],
                args=[0, 0, 0],
                default=Sentinel,
                expected=1,
            ),
            "One layer dict with one layer list": Params(
                value={"foo": [1]},
                args=["foo", 0],
                default=Sentinel,
                expected=1,
            ),
            "One layer list with one layer dict": Params(
                value=[{"foo": 1}],
                args=[0, "foo"],
                default=Sentinel,
                expected=1,
            ),
            "One layer dict with one layer list with one layer dict": Params(
                value={"foo": [{"bar": 1}]},
                args=["foo", 0, "bar"],
                default=Sentinel,
                expected=1,
            ),
            "One layer list with one layer dict with one layer list": Params(
                value=[{"foo": [1]}],
                args=[0, "foo", 0],
                default=Sentinel,
                expected=1,
            ),
            "One layer default dict": Params(
                value=None,
                args=["foo"],
                default=1,
                expected=1,
            ),
            "Two layer default dict": Params(
                value={"foo": None},
                args=["foo", "bar"],
                default=1,
                expected=1,
            ),
            "Three layer default dict": Params(
                value=None,
                args=["foo", "bar", "baz"],
                default=1,
                expected=1,
            ),
            "One layer default list": Params(
                value=None,
                args=[0],
                default=1,
                expected=1,
            ),
            "Two layer default list": Params(
                value=[None],
                args=[0, 0],
                default=1,
                expected=1,
            ),
            "Three layer default list": Params(
                value=None,
                args=[0, 0, 0],
                default=1,
                expected=1,
            ),
        }
    )
)
def test_get_nested(value, args, default, expected):
    assert get_nested(value, *args, default=default) == expected
