from typing import ParamSpec, TypeVar

import pytest

from tests.helpers import GraphQLClient

T = TypeVar("T")
P = ParamSpec("P")


@pytest.fixture()
def graphql() -> GraphQLClient:
    return GraphQLClient()
