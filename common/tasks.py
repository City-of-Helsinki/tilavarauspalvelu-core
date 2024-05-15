import json
from contextlib import suppress

from common.models import RequestLog, SQLLog
from common.typing import QueryInfo
from tilavarauspalvelu.celery import app

__all__ = [
    "save_sql_queries_from_request",
]


@app.task(name="save_sql_queries_from_request")
def save_sql_queries_from_request(queries: list[QueryInfo], path: str, body: bytes, duration_ms: int) -> None:
    decoded_body: str | None = None
    if path.startswith("/graphql"):
        with suppress(Exception):
            decoded_body = body.decode()
        if decoded_body:
            data = json.loads(decoded_body)
            decoded_body = data.get("query")

    request_log = RequestLog.objects.create(
        path=path,
        body=decoded_body,
        duration_ms=duration_ms,
    )
    sql_logs = [
        SQLLog(
            request_log=request_log,
            sql=query["sql"],
            succeeded=query["succeeded"],
            duration_ns=query["duration_ns"],
        )
        for query in queries
    ]
    SQLLog.objects.bulk_create(sql_logs)
