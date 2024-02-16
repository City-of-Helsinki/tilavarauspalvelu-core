from uuid import UUID

from django.conf import settings
from requests import RequestException, Response

from merchants.verkkokauppa import constants as verkkokauppa_constants
from merchants.verkkokauppa.exceptions import VerkkokauppaConfigurationError
from merchants.verkkokauppa.order.exceptions import (
    CancelOrderError,
    CreateOrderError,
    GetOrderError,
    ParseOrderError,
)
from merchants.verkkokauppa.order.types import CreateOrderParams, Order
from utils.external_service.base_external_service_client import BaseExternalServiceClient
from utils.external_service.errors import ExternalServiceError
from utils.sentry import log_exception_to_sentry

__all__ = [
    "VerkkokauppaAPIClient",
]


class VerkkokauppaAPIClient(BaseExternalServiceClient):
    SERVICE_NAME = "Verkkokauppa"
    REQUEST_TIMEOUT_SECONDS = verkkokauppa_constants.REQUEST_TIMEOUT_SECONDS

    ##########
    # Orders #
    ##########

    @classmethod
    def get_order(cls, *, order_uuid: UUID) -> Order:
        action_fail = "Order retrieval failed"

        base_url = settings.VERKKOKAUPPA_ORDER_API_URL.removesuffix("/")
        url = f"{base_url}/admin/{order_uuid}"

        try:
            response = cls.get(url=url)
            response_json = cls.response_json(response)

            if response.status_code == 404:
                raise GetOrderError(f"Order not found: {response_json.get('errors')}")
            elif response.status_code != 200:
                raise GetOrderError(f"{action_fail}: {response_json.get('errors')}")

            return Order.from_json(response_json)

        except (RequestException, ExternalServiceError, ParseOrderError) as err:
            log_exception_to_sentry(err, details=f"{action_fail}.", order_id=order_uuid)
            raise GetOrderError(f"{action_fail}: {err!s}") from err

    @classmethod
    def create_order(cls, *, order_params: CreateOrderParams) -> Order:
        action_fail = "Order creation failed"
        base_url = settings.VERKKOKAUPPA_ORDER_API_URL.removesuffix("/")
        url = base_url

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
            log_exception_to_sentry(err, details=f"{action_fail}.", order_params=order_params)
            raise CreateOrderError(f"{action_fail}: {err!s}") from err

    @classmethod
    def cancel_order(cls, *, order_uuid: UUID, user_uuid: UUID) -> Order | None:
        action_fail = "Order cancellation failed"
        base_url = settings.VERKKOKAUPPA_ORDER_API_URL.removesuffix("/")
        url = f"{base_url}/{order_uuid}/cancel"

        try:
            response = cls.post(url=url, user=str(user_uuid))
            response_json = cls.response_json(response)

            if response.status_code == 404:
                return None
            elif response.status_code != 200:
                raise CancelOrderError(f"{action_fail}: {response_json.get('errors')}")

            return Order.from_json(response_json["order"])

        except (RequestException, ExternalServiceError, ParseOrderError) as err:
            log_exception_to_sentry(err, details=f"{action_fail}.", order_id=order_uuid)
            raise CancelOrderError(f"{action_fail}: {err!s}") from err

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

    ################
    # Base methods #
    ################

    @classmethod
    def get(cls, *, url: str, params: dict | None = None, **headers) -> Response:
        cls._validate_env_variables()

        headers = {
            "api-key": settings.VERKKOKAUPPA_API_KEY,
            "namespace": settings.VERKKOKAUPPA_NAMESPACE,
            **headers,
        }

        return super().get(url=url, params=params, headers=headers)

    @classmethod
    def post(cls, *, url: str, data: dict | None = None, **headers) -> Response:
        cls._validate_env_variables()

        headers = {
            "api-key": settings.VERKKOKAUPPA_API_KEY,
            **headers,
        }

        return super().post(
            url=url,
            data=data,
            headers=headers,
        )
