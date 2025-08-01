from __future__ import annotations

from functools import partial

profile_query = partial(build_query, "profileData", fields="firstName lastName")
