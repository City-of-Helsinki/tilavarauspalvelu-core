import uuid

from common.models import SQLLog
from common.typing import QueryInfo
from tilavarauspalvelu.celery import app

__all__ = [
    "save_sql_queries_from_request",
]


@app.task(name="save_sql_queries_from_request")
def save_sql_queries_from_request(queries: list[QueryInfo], path: str, body: bytes) -> None:
    try:
        decoded_body: str | None = body.decode()
    except Exception:
        decoded_body = None

    request_id = uuid.uuid4()
    sql_logs = [
        SQLLog(
            sql=query["sql"],
            path=path,
            body=decoded_body,
            succeeded=query["succeeded"],
            duration_ns=query["duration_ns"],
            request_id=request_id,
        )
        for query in queries
    ]
    SQLLog.objects.bulk_create(sql_logs)
