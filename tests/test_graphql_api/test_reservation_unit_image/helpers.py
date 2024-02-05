from tests.gql_builders import build_mutation

CREATE_MUTATION = build_mutation(
    "createReservationUnitImage",
    "ReservationUnitImageCreateMutationInput",
)

UPDATE_MUTATION = build_mutation(
    "updateReservationUnitImage",
    "ReservationUnitImageUpdateMutationInput",
)

DELETE_MUTATION = build_mutation(
    "deleteReservationUnitImage",
    "ReservationUnitImageDeleteMutationInput",
    selections="deleted errors",
)
