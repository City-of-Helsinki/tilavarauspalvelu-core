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
    GetPaymentError,
    ParsePaymentError,
    ParseRefundError,
    RefundPaymentError,
)
from .types import Payment, Refund


def _get_base_url():
    if not settings.VERKKOKAUPPA_PAYMENT_API_URL or not settings.VERKKOKAUPPA_API_KEY:
        raise VerkkokauppaConfigurationError()

    if settings.VERKKOKAUPPA_PAYMENT_API_URL.endswith("/"):
        return settings.VERKKOKAUPPA_PAYMENT_API_URL

    return f"{settings.VERKKOKAUPPA_PAYMENT_API_URL}/"


def get_payment(order_id: UUID, namespace: str, get=_get) -> Optional[Payment]:
    try:
        with ExternalServiceMetric(
            METRIC_SERVICE_NAME, "GET", "/payment/admin/{order_id}"
        ) as metric:
            response = get(
                url=urljoin(_get_base_url(), f"admin/{order_id}"),
                headers={
                    "api-key": settings.VERKKOKAUPPA_API_KEY,
                    "namespace": namespace,
                },
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            metric.response_status = response.status_code

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


def refund_order(order_id: UUID, post=_post) -> Optional[Refund]:
    try:
        with ExternalServiceMetric(
            METRIC_SERVICE_NAME, "POST", f"/refund/instant/{order_id}"
        ) as metric:
            response = post(
                url=urljoin(_get_base_url(), f"refund/instant/{order_id}"),
                headers={
                    "api-key": settings.VERKKOKAUPPA_API_KEY,
                    "namespace": settings.VERKKOKAUPPA_NAMESPACE,
                },
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            metric.response_status = response.status_code

        if response.status_code > 200:
            capture_message(
                f"Call to Payment Experience API refund endpoint failed with status {response.status_code}. "
                + f"Response body: {response.text}",
                level="error",
            )
            raise RefundPaymentError(
                "Payment refund failed: problem with upstream service"
            )
        json = response.json()
        refund_count = len(json["refunds"]) if "refunds" in json else 0
        if refund_count == 1:
            return Refund.from_json(json["refunds"][0])
        else:
            capture_message(
                "Call to Payment Experience API refund endpoint failed. "
                + f"Response contains {refund_count} refunds instead of one. "
                + f"Response body: {response.text}",
                level="error",
            )
            raise RefundPaymentError(
                f"Refund response refund count expected to be 1 but was {refund_count}"
            )
    except (RequestException, JSONDecodeError, ParseRefundError) as err:
        with push_scope() as scope:
            scope.set_extra("details", "Payment refund failed")
            scope.set_extra("order-id", order_id)
            capture_exception(err)
        raise RefundPaymentError(f"Payment refund failed: {str(err)}") from err
