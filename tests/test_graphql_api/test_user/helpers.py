from functools import partial

from tests.helpers import build_query

current_user_query = partial(build_query, "currentUser")
