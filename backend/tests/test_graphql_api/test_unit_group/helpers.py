from __future__ import annotations

from functools import partial

from graphene_django_extensions.testing import build_query

unit_groups_query = partial(build_query, "unitGroups", connection=True)
