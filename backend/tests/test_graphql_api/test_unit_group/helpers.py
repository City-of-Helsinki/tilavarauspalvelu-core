from __future__ import annotations

from functools import partial

unit_groups_query = partial(build_query, "unitGroups", connection=True)
