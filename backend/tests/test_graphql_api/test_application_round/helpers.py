from __future__ import annotations

import contextlib
from functools import partial
from typing import TYPE_CHECKING
from unittest.mock import patch

from graphene_django_extensions.testing import build_mutation, build_query

if TYPE_CHECKING:
    from collections.abc import Generator
    from unittest.mock import NonCallableMock

rounds_query = partial(build_query, "applicationRounds", connection=True, order_by="pkAsc")

SET_HANDLED_MUTATION = build_mutation(
    "setApplicationRoundHandled",
    "SetApplicationRoundHandledMutation",
)
SET_RESULTS_SENT_MUTATION = build_mutation(
    "setApplicationRoundResultsSent",
    "SetApplicationRoundResultsSentMutation",
)


@contextlib.contextmanager
def disable_reservation_generation() -> Generator[NonCallableMock]:
    from tilavarauspalvelu.tasks import generate_reservation_series_from_allocations_task

    path = "tilavarauspalvelu.api.graphql.types.application_round.serializers."
    path += generate_reservation_series_from_allocations_task.__name__
    path += ".delay"

    with patch(path, return_value=None) as mock:
        yield mock
