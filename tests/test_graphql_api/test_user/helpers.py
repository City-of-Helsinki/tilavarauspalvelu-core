from functools import partial

from tests.gql_builders import build_query

current_user_query = partial(build_query, "currentUser")
