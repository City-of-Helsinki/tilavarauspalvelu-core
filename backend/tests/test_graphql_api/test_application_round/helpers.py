from __future__ import annotations

import contextlib
from contextlib import contextmanager
from functools import partial
from typing import TYPE_CHECKING
from unittest.mock import patch

from tests.query_builder import build_mutation, build_query

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

    path = "tilavarauspalvelu.api.graphql.types.application_round.mutations.set_handled."
    path += generate_reservation_series_from_allocations_task.__name__
    path += ".delay"

    with patch(path, return_value=None) as mock:
        yield mock


@contextmanager
def mock_send_application_handled_email_task():
    from tilavarauspalvelu.tasks import send_application_handled_email_task

    path = "tilavarauspalvelu.api.graphql.types.application_round.mutations.set_result_sent."
    path += send_application_handled_email_task.__name__
    path += ".delay"

    with patch(path) as mock:
        yield mock
