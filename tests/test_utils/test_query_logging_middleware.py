from __future__ import annotations

import pytest
from graphene_django_extensions.testing import build_query

from tilavarauspalvelu.models.sql_log.model import SQLLog

from tests.factories import SpaceFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_query_logging_middleware(graphql, settings):
    settings.QUERY_LOGGING_ENABLED = True
    settings.QUERY_LOGGING_DURATION_MS_THRESHOLD = 0
    settings.QUERY_LOGGING_QUERY_COUNT_THRESHOLD = 0
    settings.QUERY_LOGGING_BODY_LENGTH_THRESHOLD = 0

    SpaceFactory.create()

    assert SQLLog.objects.count() == 0

    query = build_query("spaces", connection=True)
    graphql.login_with_superuser()
    response = graphql(query)

    assert response.has_errors is False, response

    # Check created logs
    logs = list(SQLLog.objects.all())
    # Might have 1 extra query for session, doesn't always happen for some reason
    if len(logs) == 4:
        logs = logs[1:]

    assert len(logs) == 3

    # Fetching user
    assert logs[0].request_log.path == "/graphql/"
    assert logs[0].succeeded is True
    assert 'FROM "user"' in logs[0].sql

    # Counting spaces for pagination
    assert logs[1].request_log.path == "/graphql/"
    assert logs[1].succeeded is True
    assert logs[1].sql == 'SELECT COUNT(*) AS "__count" FROM "space"'

    # Fetching spaces
    assert logs[2].request_log.path == "/graphql/"
    assert logs[2].succeeded is True
    assert logs[2].sql == 'SELECT "space"."id" FROM "space" ORDER BY "space"."tree_id" ASC, "space"."lft" ASC LIMIT 1'

    # All logs are for the same request
    assert logs[0].request_log.request_id == logs[1].request_log.request_id
    assert logs[0].request_log.request_id == logs[2].request_log.request_id

    # All logs have the same body saved
    assert logs[0].request_log.body == "query { spaces { edges { node { pk } } } }"
    assert logs[0].request_log.body == logs[1].request_log.body
    assert logs[0].request_log.body == logs[2].request_log.body
