from functools import partial

from graphene_django_extensions.testing import build_query

current_user_query = partial(build_query, "currentUser")
