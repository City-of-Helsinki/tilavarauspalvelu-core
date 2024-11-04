from functools import partial

from graphene_django_extensions.testing import build_mutation, build_query

current_user_query = partial(build_query, "currentUser")

UPDATE_MUTATION = build_mutation("updateCurrentUser", "CurrentUserUpdateMutation")
STAFF_UPDATE_MUTATION = build_mutation("updateStaffUser", "UserStaffUpdateMutation")
