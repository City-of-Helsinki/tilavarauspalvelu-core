from uuid import UUID

from django.conf import settings
from requests import RequestException, Response

from merchants.verkkokauppa import constants as verkkokauppa_constants
from merchants.verkkokauppa.exceptions import VerkkokauppaConfigurationError
from merchants.verkkokauppa.merchants.exceptions import (
    CreateMerchantError,
    GetMerchantError,
    ParseMerchantError,
    UpdateMerchantError,
)
from merchants.verkkokauppa.merchants.types import CreateMerchantParams, Merchant, MerchantInfo, UpdateMerchantParams
from merchants.verkkokauppa.order.exceptions import (
    CancelOrderError,
    CreateOrderError,
    GetOrderError,
    ParseOrderError,
)
from merchants.verkkokauppa.order.types import CreateOrderParams, Order
from merchants.verkkokauppa.payment.exceptions import (
    GetPaymentError,
    GetRefundStatusError,
    ParsePaymentError,
    ParseRefundError,
    ParseRefundStatusError,
    RefundPaymentError,
)
from merchants.verkkokauppa.payment.types import Payment, Refund, RefundStatusResult
from merchants.verkkokauppa.product.exceptions import (
    CreateOrUpdateAccountingError,
    CreateProductError,
    ParseAccountingError,
    ParseProductError,
)
from merchants.verkkokauppa.product.types import (
    Accounting,
    CreateOrUpdateAccountingParams,
    CreateProductParams,
    Product,
)
from utils.external_service.base_external_service_client import BaseExternalServiceClient
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "VerkkokauppaAPIClient",
]

from utils.sentry import SentryLogger


class VerkkokauppaAPIClient(BaseExternalServiceClient):
    SERVICE_NAME = "Verkkokauppa"
    REQUEST_TIMEOUT_SECONDS = verkkokauppa_constants.REQUEST_TIMEOUT_SECONDS

    #########
    # Order #
    #########

    @classmethod
    def get_order(cls, *, order_uuid: UUID) -> Order:
        action_fail = "Order retrieval failed"
        url = f"{settings.VERKKOKAUPPA_ORDER_API_URL}/admin/{order_uuid}"

        try:
            response = cls.get(url=url, headers={"namespace": settings.VERKKOKAUPPA_NAMESPACE})
            response_json = cls.response_json(response)

            if response.status_code == 404:
                raise GetOrderError(f"Order not found: {response_json.get('errors')}")
            elif response.status_code != 200:
                raise GetOrderError(f"{action_fail}: {response_json.get('errors')}")

            return Order.from_json(response_json)

        except (RequestException, ExternalServiceError, ParseOrderError) as err:
            SentryLogger.log_exception(err, details=f"{action_fail}.", order_id=order_uuid)
            raise GetOrderError(f"{action_fail}: {err!s}") from err

    @classmethod
    def create_order(cls, *, order_params: CreateOrderParams) -> Order:
        action_fail = "Order creation failed"
        url = settings.VERKKOKAUPPA_ORDER_API_URL

        try:
            response = cls.post(
                url=url,
                data=order_params.to_json(),
            )
            response_json = cls.response_json(response)

            if response.status_code != 201:
                raise CreateOrderError(f"{action_fail}: {response_json.get('errors')}")

            return Order.from_json(response_json)

        except (RequestException, ExternalServiceError, ParseOrderError) as err:
            SentryLogger.log_exception(err, details=f"{action_fail}.", order_params=order_params)
            raise CreateOrderError(f"{action_fail}: {err!s}") from err

    @classmethod
    def cancel_order(cls, *, order_uuid: UUID, user_uuid: UUID) -> Order | None:
        action_fail = "Order cancellation failed"
        url = f"{settings.VERKKOKAUPPA_ORDER_API_URL}/{order_uuid}/cancel"

        try:
            response = cls.post(
                url=url,
                headers={"user": str(user_uuid)},
            )
            response_json = cls.response_json(response)

            if response.status_code == 404:
                return None
            elif response.status_code != 200:
                raise CancelOrderError(f"{action_fail}: {response_json.get('errors')}")

            return Order.from_json(response_json["order"])

        except (RequestException, ExternalServiceError, ParseOrderError) as err:
            SentryLogger.log_exception(err, details=f"{action_fail}.", order_id=order_uuid)
            raise CancelOrderError(f"{action_fail}: {err!s}") from err

    ###########
    # Payment #
    ###########

    @classmethod
    def get_payment(cls, *, order_uuid: UUID) -> Payment | None:
        action_fail = "Payment retrieval failed"
        url = f"{settings.VERKKOKAUPPA_PAYMENT_API_URL}/admin/{order_uuid}"

        try:
            response = cls.get(
                url=url,
                headers={"namespace": settings.VERKKOKAUPPA_NAMESPACE},
            )
            response_json = cls.response_json(response)

            if response.status_code == 404:
                return None

            if response.status_code != 200:
                raise GetPaymentError(f"{action_fail}: {response_json.get('errors')}")

            return Payment.from_json(response_json)

        except (RequestException, ExternalServiceError, ParsePaymentError) as err:
            raise GetPaymentError(action_fail) from err

    @classmethod
    def get_refund_status(cls, *, order_uuid: UUID) -> RefundStatusResult | None:
        action_fail = "Payment refund status retrieval failed"
        url = f"{settings.VERKKOKAUPPA_PAYMENT_API_URL}/admin/refund-payment/{order_uuid}"

        try:
            response = cls.get(
                url=url,
                headers={"namespace": settings.VERKKOKAUPPA_NAMESPACE},
            )
            response_json = cls.response_json(response)

            if response.status_code == 404:
                return None

            if response.status_code != 200:
                raise GetRefundStatusError(f"{action_fail}: {response_json.get('errors')}")

            return RefundStatusResult.from_json(response_json)

        except (RequestException, ExternalServiceError, ParseRefundStatusError) as err:
            raise GetRefundStatusError(f"{action_fail}: {err!s}") from err

    @classmethod
    def refund_order(cls, *, order_uuid: UUID) -> Refund | None:
        action_fail = "Payment refund failed"
        url = f"{settings.VERKKOKAUPPA_PAYMENT_API_URL}/refund/instant/{order_uuid}"

        try:
            response = cls.post(
                url=url,
                headers={"namespace": settings.VERKKOKAUPPA_NAMESPACE},
            )
            response_json = cls.response_json(response)

            if response.status_code > 200:
                SentryLogger.log_message(
                    message=f"Call to Payment Experience API refund endpoint failed with status {response.status_code}",
                    details=f"Response body: {response.text}",
                    level="error",
                )
                raise RefundPaymentError(f"{action_fail}: problem with upstream service")

            refund_count = len(response_json["refunds"]) if "refunds" in response_json else 0
            if refund_count == 1:
                return Refund.from_json(response_json["refunds"][0])
            else:
                SentryLogger.log_message(
                    message="Call to Payment Experience API refund endpoint failed, too many refunds in response.",
                    details=f"Response contains {refund_count} refunds instead of one. Response body: {response.text}",
                    level="error",
                )
                raise RefundPaymentError(f"Refund response refund count expected to be 1 but was {refund_count}")

        except (RequestException, ExternalServiceError, ParseRefundError) as err:
            SentryLogger.log_exception(err, details=action_fail, order_id=order_uuid)
            raise RefundPaymentError(f"{action_fail}: {err!s}") from err

    ############
    # Merchant #
    ############

    @classmethod
    def get_merchant(cls, *, merchant_uuid: UUID) -> MerchantInfo | None:
        action_fail = f"Fetching merchant {merchant_uuid} failed"
        url = f"{settings.VERKKOKAUPPA_MERCHANT_API_URL}/{settings.VERKKOKAUPPA_NAMESPACE}/{merchant_uuid}"

        try:
            response = cls.get(url=url)
            response_json = cls.response_json(response)

            if response.status_code == 404:
                return None

            if response.status_code != 200:
                raise GetMerchantError(f"{action_fail}: {response_json.get('errors')}")

            return MerchantInfo.from_json(response_json)
        except (RequestException, ExternalServiceError, ParseMerchantError) as err:
            raise GetMerchantError(f"{action_fail}: {err!s}") from err

    @classmethod
    def create_merchant(cls, *, params: CreateMerchantParams) -> Merchant:
        action_fail = "Merchant creation failed"
        url = f"create/merchant/{settings.VERKKOKAUPPA_NAMESPACE}"

        try:
            response = cls.post(
                url=f"{settings.VERKKOKAUPPA_MERCHANT_API_URL}/{url}",
                data=params.to_json(),
            )
            response_json = cls.response_json(response)

            if response.status_code != 201:
                raise CreateMerchantError(f"{action_fail}: {response_json.get('errors')}")

            return Merchant.from_json(response_json)

        except (RequestException, ExternalServiceError, ParseMerchantError) as err:
            raise CreateMerchantError(action_fail) from err

    @classmethod
    def update_merchant(cls, *, merchant_uuid: UUID, params: UpdateMerchantParams) -> Merchant:
        action_fail = "Merchant update failed"
        url = f"update/merchant/{settings.VERKKOKAUPPA_NAMESPACE}/{merchant_uuid}"

        try:
            response = cls.post(
                url=f"{settings.VERKKOKAUPPA_MERCHANT_API_URL}/{url}",
                data=params.to_json(),
            )
            response_json = cls.response_json(response)

            if response.status_code == 404:
                raise UpdateMerchantError(f"{action_fail}: merchant {merchant_uuid} not found")
            if response.status_code != 200:
                raise UpdateMerchantError(f"{action_fail}: {response_json.get('errors')}")

            return Merchant.from_json(response_json)

        except (RequestException, ExternalServiceError, ParseMerchantError) as err:
            raise UpdateMerchantError(action_fail) from err

    ###########
    # Product #
    ###########

    @classmethod
    def create_product(cls, *, params: CreateProductParams) -> Product:
        action_fail = "Product creation failed"
        url = f"{settings.VERKKOKAUPPA_PRODUCT_API_URL}"

        try:
            response = cls.post(
                url=url,
                data=params.to_json(),
            )
            response_json = cls.response_json(response)

            if response.status_code != 201:
                raise CreateProductError(f"{action_fail}: {response_json.get('errors')}")

            return Product.from_json(response_json)

        except (RequestException, ExternalServiceError, ParseProductError) as err:
            raise CreateProductError(f"{action_fail}: {err}") from err

    @classmethod
    def create_or_update_accounting(cls, *, product_uuid: UUID, params: CreateOrUpdateAccountingParams) -> Accounting:
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
                data=params.to_json(),
                headers={"namespace": settings.VERKKOKAUPPA_NAMESPACE},
            )
            response_json = cls.response_json(response)

            if response.status_code != 201:
                raise CreateOrUpdateAccountingError(f"{action_fail}: {response_json.get('errors')}")

            return Accounting.from_json(response_json)

        except (RequestException, ExternalServiceError, ParseAccountingError) as err:
            raise CreateOrUpdateAccountingError(f"{action_fail}: {err}") from err

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
    def handle_500_error(cls, response: Response) -> None:
        """
        API documentation says that these error codes should are associated with status 404, but in reality the API
        returns a status 500 with these error codes. They have plans to fix this, but just to avoid breaking things
        with unnoticed changes we are converting these 500 status codes to the correct 404 instead.
        This handling can be removed after webshop API is fixed.
        """
        false_500_error_codes = ["failed-to-get-payment-for-order", "failed-to-get-refund-payment-for-order"]

        if response.status_code == 500:
            response_json = cls.response_json(response)
            errors = response_json.get("errors", [])
            if len(errors) > 0 and errors[0].get("code") in false_500_error_codes:
                response.status_code = 404
                return

        raise super().handle_500_error(response)

    ################
    # Base methods #
    ################

    @classmethod
    def get(cls, *, url: str, params: dict | None = None, headers=None) -> Response:
        cls._validate_env_variables()

        headers = {
            "api-key": settings.VERKKOKAUPPA_API_KEY,
            **(headers if headers else {}),
        }

        return super().get(url=url, params=params, headers=headers)

    @classmethod
    def post(cls, *, url: str, data: dict | None = None, headers=None) -> Response:
        cls._validate_env_variables()

        headers = {
            "api-key": settings.VERKKOKAUPPA_API_KEY,
            **(headers if headers else {}),
        }

        return super().post(url=url, data=data, headers=headers)
