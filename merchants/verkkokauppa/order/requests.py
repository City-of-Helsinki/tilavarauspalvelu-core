from json import JSONDecodeError
from urllib.parse import urljoin
from uuid import UUID

from django.conf import settings
from requests import RequestException
from requests import get as _get
from requests import post as _post

from ..constants import REQUEST_TIMEOUT_SECONDS
from .exceptions import CreateOrderError, GetOrderError, ParseOrderError
from .types import CreateOrderParams, Order


def create_order(params: CreateOrderParams, post=_post) -> Order:
    try:
        response = post(
            url=settings.VERKKOKAUPPA_ORDER_API_URL,
            json=params.to_json(),
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        json = response.json()
        if response.status_code != 201:
            raise CreateOrderError(f"Order creation failed: {json.get('errors')}")
        return Order.from_json(json)
    except (RequestException, JSONDecodeError, ParseOrderError) as e:
        raise CreateOrderError("Order creation failed") from e


def get_order(order_id: UUID, user: str, get=_get) -> Order:
    try:
        response = get(
            url=urljoin(settings.VERKKOKAUPPA_ORDER_API_URL, f"admin/{order_id}"),
            headers={
                "api-key": settings.VERKKOKAUPPA_API_KEY,
                "namespace": settings.VERKKOKAUPPA_NAMESPACE,
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        json = response.json()
        if response.status_code == 404:
            raise GetOrderError(f"Order not found: {json.get('errors')}")
        if response.status_code != 200:
            raise GetOrderError(f"Order retrieval failed: {json.get('errors')}")
        return Order.from_json(json)
    except (RequestException, JSONDecodeError, ParseOrderError) as e:
        raise GetOrderError("Order retrieval failed") from e
