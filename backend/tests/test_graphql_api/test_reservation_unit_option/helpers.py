from __future__ import annotations

from functools import partial

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
