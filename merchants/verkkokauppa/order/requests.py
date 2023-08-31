from json import JSONDecodeError
from typing import Optional
from urllib.parse import urljoin
from uuid import UUID

from django.conf import settings
from requests import RequestException
from requests import get as _get
from requests import post as _post
from sentry_sdk import capture_exception, capture_message, push_scope

from utils.metrics import ExternalServiceMetric

from ..constants import METRIC_SERVICE_NAME, REQUEST_TIMEOUT_SECONDS
from ..exceptions import VerkkokauppaConfigurationError
from .exceptions import (
    CancelOrderError,
    CreateOrderError,
    GetOrderError,
    ParseOrderError,
)
from .types import CreateOrderParams, Order


def _get_base_url():
    if not settings.VERKKOKAUPPA_ORDER_API_URL or not settings.VERKKOKAUPPA_API_KEY:
        raise VerkkokauppaConfigurationError()

    if settings.VERKKOKAUPPA_ORDER_API_URL.endswith("/"):
        return settings.VERKKOKAUPPA_ORDER_API_URL

    return f"{settings.VERKKOKAUPPA_ORDER_API_URL}/"


def create_order(params: CreateOrderParams, post=_post) -> Order:
    try:
        with ExternalServiceMetric(METRIC_SERVICE_NAME, "POST", "/order") as metric:
            response = post(
                url=_get_base_url(),
                json=params.to_json(),
                headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            metric.response_status = response.status_code

        if response.status_code >= 500:
            capture_message(
                f"Call to Order Experience API failed with status {response.status_code}. "
                f"Response body: {response.text}",
                level="error",
            )
            raise CreateOrderError("Order creation failed: problem with upstream service")

        json = response.json()
        if response.status_code != 201:
            raise CreateOrderError(f"Order creation failed: {json.get('errors')}")
        return Order.from_json(json)
    except (RequestException, JSONDecodeError, ParseOrderError) as err:
        with push_scope() as scope:
            scope.set_extra("details", "Order creation failed")
            scope.set_extra("params", params)
            capture_exception(err)
        raise CreateOrderError(f"Order creation failed: {str(err)}") from err


def get_order(order_id: UUID, user: str, get=_get) -> Order:
    try:
        with ExternalServiceMetric(METRIC_SERVICE_NAME, "GET", "/order/admin/{order_id}") as metric:
            response = get(
                url=urljoin(_get_base_url(), f"admin/{order_id}"),
                headers={
                    "api-key": settings.VERKKOKAUPPA_API_KEY,
                    "namespace": settings.VERKKOKAUPPA_NAMESPACE,
                },
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            metric.response_status = response.status_code

        json = response.json()
        if response.status_code == 404:
            raise GetOrderError(f"Order not found: {json.get('errors')}")
        if response.status_code != 200:
            raise GetOrderError(f"Order retrieval failed: {json.get('errors')}")
        return Order.from_json(json)
    except (RequestException, JSONDecodeError, ParseOrderError) as err:
        with push_scope() as scope:
            scope.set_extra("details", "Order retrieval failed")
            scope.set_extra("order-id", order_id)
            capture_exception(err)
        raise GetOrderError(f"Order retrieval failed: {str(err)}") from err


def cancel_order(order_id: UUID, user_uuid: UUID, post=_post) -> Optional[Order]:
    try:
        with ExternalServiceMetric(METRIC_SERVICE_NAME, "POST", "/order/{order_id}/cancel") as metric:
            response = post(
                url=urljoin(_get_base_url(), f"{str(order_id)}/cancel"),
                headers={
                    "api-key": settings.VERKKOKAUPPA_API_KEY,
                    "user": str(user_uuid),
                },
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            metric.response_status = response.status_code

        if response.status_code >= 500:
            capture_message(
                f"Call to Order Experience API cancel endpoint failed with status {response.status_code}. "
                f"Response body: {response.text}",
                level="error",
            )
            raise CancelOrderError("Order cancellation failed: problem with upstream service")
        if response.status_code == 404:
            return None

        json = response.json()
        if response.status_code != 200:
            json = response.json()
            raise CancelOrderError(f"Order cancellation failed: {json.get('errors')}")

        return Order.from_json(json["order"])

    except (RequestException, JSONDecodeError, ParseOrderError) as err:
        with push_scope() as scope:
            scope.set_extra("details", "Order cancellation failed")
            scope.set_extra("order-id", order_id)
            capture_exception(err)
        raise CancelOrderError(f"Order cancellation failed: {str(err)}") from err
