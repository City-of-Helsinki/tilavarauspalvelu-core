from functools import partial

from tests.gql_builders import build_mutation, build_query

TIMESLOTS_QUERY = build_query(
    "reservationUnits",
    connection=True,
    fields="applicationRoundTimeSlots {weekday closed reservableTimes{begin end}}",
)

reservation_units_query = partial(build_query, "reservationUnits", connection=True)

reservation_unit_by_pk_query = partial(build_query, "reservationUnitByPk")

CREATE_MUTATION = build_mutation(
    "createReservationUnit",
    "ReservationUnitCreateMutationInput",
)

UPDATE_MUTATION = build_mutation(
    "updateReservationUnit",
    "ReservationUnitUpdateMutationInput",
)
