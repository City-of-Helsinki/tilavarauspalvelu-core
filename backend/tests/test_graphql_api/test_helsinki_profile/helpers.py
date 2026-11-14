from functools import partial

from graphene_django_extensions.testing import build_query

profile_query = partial(build_query, "profileData", fields="firstName lastName")
