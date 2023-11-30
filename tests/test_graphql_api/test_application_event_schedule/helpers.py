from functools import partial

from tests.gql_builders import build_mutation, build_query

schedules_query = partial(
    build_query,
    "applicationEventSchedules",
    connection=True,
    order_by="pk",
)

events_with_schedules_query = partial(
    build_query,
    "applicationEvents",
    fields="applicationEventSchedules { pk }",
    connection=True,
    order_by="pk",
)


APPROVE_MUTATION = build_mutation(
    "approveApplicationEventSchedule",
    "ApplicationEventScheduleApproveMutationInput",
)

DECLINE_MUTATION = build_mutation(
    "declineApplicationEventSchedule",
    "ApplicationEventScheduleDeclineMutationInput",
)
