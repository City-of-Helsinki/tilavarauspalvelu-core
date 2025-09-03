from __future__ import annotations

from functools import cache
from typing import TYPE_CHECKING, Any

import pytest
from django.conf import settings
from graphql import UndefinedType

from utils.utils import check_path

from .match_queries_to_factories import match_queries_to_factories

if TYPE_CHECKING:
    from .match_queries_to_factories import QueryInfo


@cache
def get_customer_query_info() -> dict[str, list[QueryInfo]]:
    customer_file = settings.BASE_DIR.parent / "gql-pluck-output" / "customer-queries.graphql"
    check_path(customer_file, should_be_file=True)
    return match_queries_to_factories(customer_file)


@cache
def get_admin_query_info() -> dict[str, list[QueryInfo]]:
    admin_file = settings.BASE_DIR.parent / "gql-pluck-output" / "admin-queries.graphql"
    check_path(admin_file, should_be_file=True)
    return match_queries_to_factories(admin_file)


def assert_no_undefined_variables(args: dict[str, Any]) -> None:
    undefined = "\n".join(key for key, value in args.items() if isinstance(value, UndefinedType))
    if undefined:
        msg = f"Some variables are still undefined:\n{undefined}"
        raise pytest.fail(msg, pytrace=False)
