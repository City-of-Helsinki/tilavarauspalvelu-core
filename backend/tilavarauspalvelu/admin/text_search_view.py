from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any

from admin_data_views.typing import TableContext
from admin_data_views.utils import render_with_table_view
from django.conf import settings
from django.core.cache import cache

if TYPE_CHECKING:
    from django.http import HttpRequest


@render_with_table_view
def text_search_list_view(request: HttpRequest, **kwargs: Any) -> TableContext:
    """Show all text searches in a table view."""
    data: dict[str, str] = cache.get_many(cache.keys("text_search:*"))

    timestamps: list[str] = []
    locations: list[str] = []
    searches: list[str] = []
    for key, value in data.items():
        _, location, timestamp = key.split(":", maxsplit=2)
        timestamps.append(datetime.datetime.fromisoformat(timestamp).isoformat(timespec="seconds"))
        locations.append(location.capitalize().replace("_", " "))
        searches.append(value)

    return TableContext(
        title=f"Text searches in the last {settings.TEXT_SEARCH_CACHE_TIME_DAYS} days",
        table={
            "Location": locations,
            "Search": searches,
            "Timestamp": timestamps,
        },
    )
