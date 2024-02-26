from graphene_django_extensions.testing import build_mutation

UPDATE_MUTATION = build_mutation(
    "updateReservationUnitOption",
    "ReservationUnitOptionUpdateMutation",
)
