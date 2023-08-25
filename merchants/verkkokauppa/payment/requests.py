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
    GetRefundStatusError,
    ParsePaymentError,
    ParseRefundError,
    ParseRefundStatusError,
    RefundPaymentError,
)
from .types import Payment, Refund, RefundStatusResult


def _get_base_url():
    if not settings.VERKKOKAUPPA_PAYMENT_API_URL or not settings.VERKKOKAUPPA_API_KEY:
        raise VerkkokauppaConfigurationError()

    if settings.VERKKOKAUPPA_PAYMENT_API_URL.endswith("/"):
        return settings.VERKKOKAUPPA_PAYMENT_API_URL

    return f"{settings.VERKKOKAUPPA_PAYMENT_API_URL}/"


def get_payment(order_id: UUID, namespace: str, get=_get) -> Optional[Payment]:
    try:
        with ExternalServiceMetric(METRIC_SERVICE_NAME, "GET", "/payment/admin/{order_id}") as metric:
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
        errors = json.get("errors", [])

        # API documentation says it returns 404 but in reality it
        # returns 500 with error code. They have plans to fix this
        # but just to avoid breaking things with unnotified changes we
        # are handling both cases. 500 handling can be removed after
        # webshop API is updated.
        if (
            response.status_code == 500 and errors and errors[0].get("code") == "failed-to-get-payment-for-order"
        ) or response.status_code == 404:
            return None

        if response.status_code != 200:
            raise GetPaymentError(f"Payment retrieval failed: {json.get('errors')}")
        return Payment.from_json(json)
    except (RequestException, JSONDecodeError, ParsePaymentError) as e:
        raise GetPaymentError("Payment retrieval failed") from e


def get_refund_status(order_id: UUID, namespace: str, get=_get) -> Optional[RefundStatusResult]:
    try:
        with ExternalServiceMetric(METRIC_SERVICE_NAME, "GET", "/payment/admin/refund-payment/{order_id}") as metric:
            response = get(
                url=urljoin(_get_base_url(), f"admin/refund-payment/{order_id}"),
                headers={
                    "api-key": settings.VERKKOKAUPPA_API_KEY,
                    "namespace": namespace,
                },
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            metric.response_status = response.status_code

        json = response.json()
        errors = json.get("errors", [])

        # API documentation says it returns 404 but in reality it
        # returns 500 with error code. They have plans to fix this
        # but just to avoid breaking things with unnotified changes we
        # are handling both cases. 500 handling can be removed after
        # webshop API is updated.
        if (
            response.status_code == 500
            and len(errors) > 0
            and errors[0].get("code") == "failed-to-get-refund-payment-for-order"
        ) or response.status_code == 404:
            return None

        if response.status_code != 200:
            raise GetRefundStatusError(f"Payment refund status retrieval failed: {json.get('errors')}")
        return RefundStatusResult.from_json(json)
    except (RequestException, JSONDecodeError, ParseRefundStatusError) as e:
        raise GetRefundStatusError(f"Payment refund status retrieval failed: {str(e)}") from e


def refund_order(order_id: UUID, post=_post) -> Optional[Refund]:
    try:
        with ExternalServiceMetric(METRIC_SERVICE_NAME, "POST", f"/refund/instant/{order_id}") as metric:
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
            raise RefundPaymentError("Payment refund failed: problem with upstream service")
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
            raise RefundPaymentError(f"Refund response refund count expected to be 1 but was {refund_count}")
    except (RequestException, JSONDecodeError, ParseRefundError) as err:
        with push_scope() as scope:
            scope.set_extra("details", "Payment refund failed")
            scope.set_extra("order-id", order_id)
            capture_exception(err)
        raise RefundPaymentError(f"Payment refund failed: {str(err)}") from err
