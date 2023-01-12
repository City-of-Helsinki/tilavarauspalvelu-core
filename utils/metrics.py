from time import perf_counter
from typing import Optional

from prometheus_client import Counter, Histogram

PREFIX = "tvp_"


class Metrics:
    """
    Defined custom metrics for Prometheus

    If you want to add more custom metrics, add them here.
    """

    service_calls_latency = Histogram(
        f"{PREFIX}external_service_calls_latency_seconds",
        "Histogram of external service latencies",
        labelnames=["service", "method", "path"],
    )
    service_calls = Counter(
        f"{PREFIX}external_service_calls",
        "Counter of external service calls",
        labelnames=["service", "method", "path"],
    )
    service_responses = Counter(
        f"{PREFIX}external_service_responses",
        "Counter of external service responses by status code",
        labelnames=["service", "method", "path", "status"],
    )


class ExternalServiceMetric:
    """
    Wrapper for monitoring external service calls.

    Collects number of calls and latencies. If response_status is
    set during the call, it also collect response status codes.
    """

    service: str
    method: str
    path: str
    response_status: Optional[int]

    def __init__(self, service: str, method: str, path: str) -> None:
        self.service = service
        self.method = method
        self.path = path
        self.response_status = None

    def __enter__(self):
        self.start_time = perf_counter()
        return self

    def __exit__(self, *args):
        duration = perf_counter() - self.start_time

        Metrics.service_calls_latency.labels(
            service=self.service, method=self.method, path=self.path
        ).observe(duration)
        Metrics.service_calls.labels(
            service=self.service, method=self.method, path=self.path
        ).inc()

        if self.response_status:
            Metrics.service_responses.labels(
                service=self.service,
                method=self.method,
                path=self.path,
                status=self.response_status,
            ).inc()
