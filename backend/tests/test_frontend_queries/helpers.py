from __future__ import annotations

from functools import cache
from typing import TYPE_CHECKING, Any

from django.conf import settings
from graphql import Undefined

if TYPE_CHECKING:
    from pathlib import Path


def check_path(path: Path, *, should_be_file: bool = False, should_be_dir: bool = False) -> Path:
    if not path.exists():
        msg = f"{path} does not exist"
        raise FileNotFoundError(msg)

    if should_be_file and not path.is_file():
        msg = f"{path} is not a file"
        raise FileNotFoundError(msg)

    if should_be_dir and not path.is_dir():
        msg = f"{path} is not a directory"
        raise FileNotFoundError(msg)

    return path


GQL_PATH = check_path(settings.BASE_DIR.parent / "graphql", should_be_dir=True)
CUSTOMER_FILE = check_path(GQL_PATH / "customer-queries.graphql", should_be_file=True)
ADMIN_FILE = check_path(GQL_PATH / "admin-queries.graphql", should_be_file=True)


@cache
def get_customer_query_factories():
    from tilavarauspalvelu.management.commands.match_queries_to_factories import match_queries_to_factories

    return match_queries_to_factories(CUSTOMER_FILE)


def do_replacements(args: dict[str, Any], **replacements: Any) -> None:
    for key, value in list(args.items()):
        final_value = replacements.get(key, value)

        if final_value is Undefined:
            args.pop(key)
            continue

        args[key] = final_value
