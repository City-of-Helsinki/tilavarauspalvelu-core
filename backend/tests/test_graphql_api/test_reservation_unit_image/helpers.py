from __future__ import annotations

CREATE_MUTATION = build_mutation(
    "createReservationUnitImage",
    "ReservationUnitImageCreateMutation",
)

UPDATE_MUTATION = build_mutation(
    "updateReservationUnitImage",
    "ReservationUnitImageUpdateMutation",
)

DELETE_MUTATION = build_mutation(
    "deleteReservationUnitImage",
    "ReservationUnitImageDeleteMutation",
    fields="deleted",
)
