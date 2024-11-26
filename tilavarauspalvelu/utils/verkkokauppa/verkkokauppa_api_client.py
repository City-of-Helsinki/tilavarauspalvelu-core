from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.conf import settings
from requests import RequestException
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED, HTTP_404_NOT_FOUND, HTTP_500_INTERNAL_SERVER_ERROR

from tilavarauspalvelu.utils.verkkokauppa import constants as verkkokauppa_constants
from tilavarauspalvelu.utils.verkkokauppa.exceptions import VerkkokauppaConfigurationError
from tilavarauspalvelu.utils.verkkokauppa.merchants.exceptions import (
    CreateMerchantError,
    GetMerchantError,
    ParseMerchantError,
    UpdateMerchantError,
)
from tilavarauspalvelu.utils.verkkokauppa.merchants.types import Merchant, MerchantInfo
from tilavarauspalvelu.utils.verkkokauppa.order.exceptions import (
    CancelOrderError,
    CreateOrderError,
    GetOrderError,
    ParseOrderError,
)
from tilavarauspalvelu.utils.verkkokauppa.order.types import Order
from tilavarauspalvelu.utils.verkkokauppa.payment.exceptions import (
    GetPaymentError,
    GetRefundStatusError,
    ParsePaymentError,
    ParseRefundError,
    ParseRefundStatusError,
    RefundPaymentError,
)
from tilavarauspalvelu.utils.verkkokauppa.payment.types import Payment, Refund, RefundStatusResult
from tilavarauspalvelu.utils.verkkokauppa.product.exceptions import (
    CreateOrUpdateAccountingError,
    CreateProductError,
    ParseAccountingError,
    ParseProductError,
)
from tilavarauspalvelu.utils.verkkokauppa.product.types import Accounting, Product
from utils.external_service.base_external_service_client import BaseExternalServiceClient
from utils.external_service.errors import ExternalServiceError
from utils.sentry import SentryLogger

if TYPE_CHECKING:
    import uuid

    from requests import Response

    from tilavarauspalvelu.utils.verkkokauppa.merchants.types import CreateMerchantParams, UpdateMerchantParams
    from tilavarauspalvelu.utils.verkkokauppa.order.types import CreateOrderParams
    from tilavarauspalvelu.utils.verkkokauppa.product.types import CreateOrUpdateAccountingParams, CreateProductParams

__all__ = [
    "VerkkokauppaAPIClient",
]


class VerkkokauppaAPIClient(BaseExternalServiceClient):
    SERVICE_NAME = "Verkkokauppa"
    REQUEST_TIMEOUT_SECONDS = verkkokauppa_constants.REQUEST_TIMEOUT_SECONDS

    #########
    # Order #
    #########
    # https://checkout-test-api.test.hel.ninja/v1/order/docs/swagger-ui/

    @classmethod
    def get_order(cls, *, order_uuid: uuid.UUID) -> Order:
        action_fail = "Order retrieval failed"
        url = f"{settings.VERKKOKAUPPA_ORDER_API_URL}/admin/{order_uuid}"

        try:
            response = cls.get(
                url=url,
                headers={"namespace": settings.VERKKOKAUPPA_NAMESPACE},
            )
            response_json = cls.response_json(response)

            if response.status_code == HTTP_404_NOT_FOUND:
                msg = f"Order not found: {response_json.get('errors')}"
                raise GetOrderError(msg)
            if response.status_code != HTTP_200_OK:
                msg = f"{action_fail}: {response_json.get('errors')}"
                raise GetOrderError(msg)

            return Order.from_json(response_json)

        except (RequestException, ExternalServiceError, ParseOrderError) as err:
            SentryLogger.log_exception(err, details=f"{action_fail}.", order_id=order_uuid)
            msg = f"{action_fail}: {err!s}"
            raise GetOrderError(msg) from err

    @classmethod
    def create_order(cls, *, order_params: CreateOrderParams) -> Order:
        action_fail = "Order creation failed"
        url = f"{settings.VERKKOKAUPPA_ORDER_API_URL}/"

        try:
            response = cls.post(
                url=url,
                json=order_params.to_json(),
            )
            response_json = cls.response_json(response)

            if response.status_code != HTTP_201_CREATED:
                msg = f"{action_fail}: {response_json.get('errors')}"
                raise CreateOrderError(msg)

            return Order.from_json(response_json)

        except (RequestException, ExternalServiceError, ParseOrderError) as err:
            SentryLogger.log_exception(err, details=f"{action_fail}.", order_params=order_params)
            msg = f"{action_fail}: {err!s}"
            raise CreateOrderError(msg) from err

    @classmethod
    def cancel_order(cls, *, order_uuid: uuid.UUID, user_uuid: uuid.UUID) -> Order | None:
        action_fail = "Order cancellation failed"
        url = f"{settings.VERKKOKAUPPA_ORDER_API_URL}/{order_uuid}/cancel"

        try:
            response = cls.post(
                url=url,
                headers={"user": str(user_uuid)},
            )
            response_json = cls.response_json(response)

            if response.status_code == HTTP_404_NOT_FOUND:
                return None
            if response.status_code != HTTP_200_OK:
                msg = f"{action_fail}: {response_json.get('errors')}"
                raise CancelOrderError(msg)

            return Order.from_json(response_json["order"])

        except (RequestException, ExternalServiceError, ParseOrderError) as err:
            SentryLogger.log_exception(err, details=f"{action_fail}.", order_id=order_uuid)
            msg = f"{action_fail}: {err!s}"
            raise CancelOrderError(msg) from err

    ###########
    # Payment #
    ###########
    # https://checkout-test-api.test.hel.ninja/v1/payment/docs/swagger-ui/

    @classmethod
    def get_payment(cls, *, order_uuid: uuid.UUID) -> Payment | None:
        action_fail = "Payment retrieval failed"
        url = f"{settings.VERKKOKAUPPA_PAYMENT_API_URL}/admin/{order_uuid}"

        try:
            response = cls.get(
                url=url,
                headers={"namespace": settings.VERKKOKAUPPA_NAMESPACE},
            )
            response_json = cls.response_json(response)

            if response.status_code == HTTP_404_NOT_FOUND:
                return None

            if response.status_code != HTTP_200_OK:
                msg = f"{action_fail}: {response_json.get('errors')}"
                raise GetPaymentError(msg)

            return Payment.from_json(response_json)

        except (RequestException, ExternalServiceError, ParsePaymentError) as err:
            raise GetPaymentError(action_fail) from err

    @classmethod
    def get_refund_status(cls, *, order_uuid: uuid.UUID) -> RefundStatusResult | None:
        action_fail = "Payment refund status retrieval failed"
        url = f"{settings.VERKKOKAUPPA_PAYMENT_API_URL}/admin/refund-payment/{order_uuid}"

        try:
            response = cls.get(
                url=url,
                headers={"namespace": settings.VERKKOKAUPPA_NAMESPACE},
            )
            response_json = cls.response_json(response)

            if response.status_code == HTTP_404_NOT_FOUND:
                return None

            if response.status_code != HTTP_200_OK:
                msg = f"{action_fail}: {response_json.get('errors')}"
                raise GetRefundStatusError(msg)

            return RefundStatusResult.from_json(response_json)

        except (RequestException, ExternalServiceError, ParseRefundStatusError) as err:
            msg = f"{action_fail}: {err!s}"
            raise GetRefundStatusError(msg) from err

    @classmethod
    def refund_order(cls, *, order_uuid: uuid.UUID) -> Refund | None:
        action_fail = "Payment refund failed"
        url = f"{settings.VERKKOKAUPPA_PAYMENT_API_URL}/refund/instant/{order_uuid}"

        try:
            response = cls.post(
                url=url,
                headers={"namespace": settings.VERKKOKAUPPA_NAMESPACE},
            )
            response_json = cls.response_json(response)

            if response.status_code > HTTP_200_OK:
                SentryLogger.log_message(
                    message=f"Call to Payment Experience API refund endpoint failed with status {response.status_code}",
                    details=f"Response body: {response.text}",
                    level="error",
                )
                msg = f"{action_fail}: problem with upstream service"
                raise RefundPaymentError(msg)

            refund_count = len(response_json["refunds"]) if "refunds" in response_json else 0
            if refund_count == 1:
                return Refund.from_json(response_json["refunds"][0])
            SentryLogger.log_message(
                message="Call to Payment Experience API refund endpoint failed, wrong amount of refunds in response.",
                details=f"Response contains {refund_count} refunds instead of one. Response body: {response.text}",
                level="error",
            )
            msg = f"Refund response refund count expected to be 1 but was {refund_count}"
            raise RefundPaymentError(msg)

        except (RequestException, ExternalServiceError, ParseRefundError) as err:
            SentryLogger.log_exception(err, details=action_fail, order_id=order_uuid)
            msg = f"{action_fail}: {err!s}"
            raise RefundPaymentError(msg) from err

    ############
    # Merchant #
    ############
    # https://checkout-test-api.test.hel.ninja/v1/merchant/docs/swagger-ui/

    @classmethod
    def get_merchant(cls, *, merchant_uuid: uuid.UUID) -> MerchantInfo | None:
        action_fail = f"Fetching merchant {merchant_uuid} failed"
        url = f"{settings.VERKKOKAUPPA_MERCHANT_API_URL}/{settings.VERKKOKAUPPA_NAMESPACE}/{merchant_uuid}"

        try:
            response = cls.get(url=url)
            response_json = cls.response_json(response)

            if response.status_code == HTTP_404_NOT_FOUND:
                return None

            if response.status_code != HTTP_200_OK:
                msg = f"{action_fail}: {response_json.get('errors')}"
                raise GetMerchantError(msg)

            return MerchantInfo.from_json(response_json)
        except (RequestException, ExternalServiceError, ParseMerchantError) as err:
            msg = f"{action_fail}: {err!s}"
            raise GetMerchantError(msg) from err

    @classmethod
    def create_merchant(cls, *, params: CreateMerchantParams) -> Merchant:
        action_fail = "Merchant creation failed"
        url = f"{settings.VERKKOKAUPPA_MERCHANT_API_URL}/create/merchant/{settings.VERKKOKAUPPA_NAMESPACE}"

        try:
            response = cls.post(
                url=url,
                json=params.to_json(),
            )
            response_json = cls.response_json(response)

            if response.status_code != HTTP_201_CREATED:
                msg = f"{action_fail}: {response_json.get('errors')}"
                raise CreateMerchantError(msg)

            return Merchant.from_json(response_json)

        except (RequestException, ExternalServiceError, ParseMerchantError) as err:
            raise CreateMerchantError(action_fail) from err

    @classmethod
    def update_merchant(cls, *, merchant_uuid: uuid.UUID, params: UpdateMerchantParams) -> Merchant:
        action_fail = "Merchant update failed"
        url = (
            f"{settings.VERKKOKAUPPA_MERCHANT_API_URL}/"
            f"update/merchant/{settings.VERKKOKAUPPA_NAMESPACE}/{merchant_uuid}"
        )

        try:
            response = cls.post(
                url=url,
                json=params.to_json(),
            )
            response_json = cls.response_json(response)

            if response.status_code == HTTP_404_NOT_FOUND:
                msg = f"{action_fail}: merchant {merchant_uuid} not found"
                raise UpdateMerchantError(msg)
            if response.status_code != HTTP_200_OK:
                msg = f"{action_fail}: {response_json.get('errors')}"
                raise UpdateMerchantError(msg)

            return Merchant.from_json(response_json)

        except (RequestException, ExternalServiceError, ParseMerchantError) as err:
            raise UpdateMerchantError(action_fail) from err

    ###########
    # Product #
    ###########
    # https://checkout-test-api.test.hel.ninja/v1/product/docs/swagger-ui/

    @classmethod
    def create_product(cls, *, params: CreateProductParams) -> Product:
        action_fail = "Product creation failed"
        url = f"{settings.VERKKOKAUPPA_PRODUCT_API_URL}/"

        try:
            response = cls.post(
                url=url,
                json=params.to_json(),
            )
            response_json = cls.response_json(response)

            if response.status_code != HTTP_201_CREATED:
                msg = f"{action_fail}: {response_json.get('errors')}"
                raise CreateProductError(msg)

            return Product.from_json(response_json)

        except (RequestException, ExternalServiceError, ParseProductError) as err:
            msg = f"{action_fail}: {err}"
            raise CreateProductError(msg) from err

    @classmethod
    def create_or_update_accounting(
        cls,
        *,
        product_uuid: uuid.UUID,
        params: CreateOrUpdateAccountingParams,
    ) -> Accounting:
        """
        Be aware that this endpoint allows creating accounting data for products that
        do not exist. This is intentional, since in some uses cases there is a need
        to create accounting information before product information.

        It is up to us to make sure that the product exists, as otherwise payments will fail.
        """
        action_fail = "Creating or updating accounting failed"
        url = f"{settings.VERKKOKAUPPA_PRODUCT_API_URL}/{product_uuid}/accounting"

        try:
            response = cls.post(
                url=url,
                json=params.to_json(),
                headers={"namespace": settings.VERKKOKAUPPA_NAMESPACE},
            )
            response_json = cls.response_json(response)

            if response.status_code != HTTP_201_CREATED:
                msg = f"{action_fail}: {response_json.get('errors')}"
                raise CreateOrUpdateAccountingError(msg)

            return Accounting.from_json(response_json)

        except (RequestException, ExternalServiceError, ParseAccountingError) as err:
            msg = f"{action_fail}: {err}"
            raise CreateOrUpdateAccountingError(msg) from err

    ##################
    # Helper methods #
    ##################

    @staticmethod
    def _validate_env_variables() -> None:
        if (
            not settings.VERKKOKAUPPA_PRODUCT_API_URL
            or not settings.VERKKOKAUPPA_ORDER_API_URL
            or not settings.VERKKOKAUPPA_PAYMENT_API_URL
            or not settings.VERKKOKAUPPA_MERCHANT_API_URL
            or not settings.VERKKOKAUPPA_API_KEY
            or not settings.VERKKOKAUPPA_NAMESPACE
        ):
            raise VerkkokauppaConfigurationError

    @classmethod
    def _get_headers(cls, headers: dict[str, Any] | None) -> dict[str, Any]:
        """Add the API key to all request headers."""
        cls._validate_env_variables()

        return {
            "api-key": settings.VERKKOKAUPPA_API_KEY,
            **(headers or {}),  # Allow adding extra headers
        }

    @classmethod
    def handle_500_error(cls, response: Response) -> None:
        """
        API documentation says that these error codes should are associated with status 404, but in reality the API
        returns a status 500 with these error codes. They have plans to fix this, but just to avoid breaking things
        with unnoticed changes we are converting these 500 status codes to the correct 404 instead.
        This handling can be removed after webshop API is fixed.
        """
        false_500_error_codes = ["failed-to-get-payment-for-order", "failed-to-get-refund-payment-for-order"]

        if response.status_code == HTTP_500_INTERNAL_SERVER_ERROR:
            response_json = cls.response_json(response)
            errors = response_json.get("errors", [])
            if len(errors) > 0 and errors[0].get("code") in false_500_error_codes:
                response.status_code = 404
                return

        raise super().handle_500_error(response)
