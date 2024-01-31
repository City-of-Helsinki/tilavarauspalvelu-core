from functools import partial

from tests.gql_builders import build_mutation, build_query

recurring_reservations_query = partial(build_query, "recurringReservations", connection=True, order_by="pk")

CREATE_MUTATION = build_mutation(
    "createRecurringReservation",
    "RecurringReservationCreateMutationInput",
)

UPDATE_MUTATION = build_mutation(
    "updateRecurringReservation",
    "RecurringReservationUpdateMutationInput",
)
