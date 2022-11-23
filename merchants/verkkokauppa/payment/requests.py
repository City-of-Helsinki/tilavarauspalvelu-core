from json import JSONDecodeError
from typing import Optional
from urllib.parse import urljoin
from uuid import UUID

from django.conf import settings
from requests import RequestException
from requests import get as _get

from ..constants import REQUEST_TIMEOUT_SECONDS
from ..exceptions import VerkkokauppaConfigurationError
from .exceptions import GetPaymentError, ParsePaymentError
from .types import Payment


def _get_base_url():
    if not settings.VERKKOKAUPPA_PAYMENT_API_URL or not settings.VERKKOKAUPPA_API_KEY:
        raise VerkkokauppaConfigurationError()

    if settings.VERKKOKAUPPA_PAYMENT_API_URL.endswith("/"):
        return settings.VERKKOKAUPPA_PAYMENT_API_URL

    return f"{settings.VERKKOKAUPPA_PAYMENT_API_URL}/"


def get_payment(order_id: UUID, namespace: str, get=_get) -> Optional[Payment]:
    try:
        response = get(
            url=urljoin(_get_base_url(), f"admin/{order_id}"),
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY, "namespace": namespace},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

        json = response.json()

        # Endpoint returns 200 with empty body is payment does not exists
        # TODO: This will change to 500 with the following body:
        # {
        #     "errors": [
        #         {
        #             "code": "failed-to-get-payment-for-order",
        #             "message": "Failed to get payment for order"
        #         }
        #     ]
        # }
        if response.status_code == 200 and json == {}:
            return None

        if response.status_code != 200:
            raise GetPaymentError(f"Payment retrieval failed: {json.get('errors')}")
        return Payment.from_json(json)
    except (RequestException, JSONDecodeError, ParsePaymentError) as e:
        raise GetPaymentError("Payment retrieval failed") from e
