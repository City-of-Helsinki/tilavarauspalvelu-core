from functools import partial

from graphene_django_extensions.testing import build_mutation, build_query

section_options_query = partial(
    build_query,
    "applicationSections",
    connection=True,
    fields="reservationUnitOptions { pk }",
)


UPDATE_MUTATION = build_mutation(
    "updateReservationUnitOption",
    "ReservationUnitOptionUpdateMutation",
)
