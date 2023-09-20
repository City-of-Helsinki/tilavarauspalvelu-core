from json import JSONDecodeError
from urllib.parse import urljoin
from uuid import UUID

from django.conf import settings
from requests import RequestException
from requests import get as _get
from requests import post as _post

from merchants.verkkokauppa.constants import METRIC_SERVICE_NAME, REQUEST_TIMEOUT_SECONDS
from merchants.verkkokauppa.exceptions import VerkkokauppaConfigurationError
from merchants.verkkokauppa.product.exceptions import (
    CreateOrUpdateAccountingError,
    CreateProductError,
    GetProductMappingError,
    ParseAccountingError,
    ParseProductError,
)
from merchants.verkkokauppa.product.types import (
    Accounting,
    CreateOrUpdateAccountingParams,
    CreateProductParams,
    Product,
)
from utils.metrics import ExternalServiceMetric


def _get_base_url():
    if not settings.VERKKOKAUPPA_PRODUCT_API_URL or not settings.VERKKOKAUPPA_API_KEY:
        raise VerkkokauppaConfigurationError()

    if settings.VERKKOKAUPPA_PRODUCT_API_URL.endswith("/"):
        return settings.VERKKOKAUPPA_PRODUCT_API_URL

    return f"{settings.VERKKOKAUPPA_PRODUCT_API_URL}/"


def create_product(params: CreateProductParams, post=_post) -> Product:
    try:
        with ExternalServiceMetric(METRIC_SERVICE_NAME, "POST", "/product") as metric:
            response = post(
                url=_get_base_url(),
                json=params.to_json(),
                headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            metric.response_status = response.status_code

        json = response.json()
        if response.status_code != 201:
            raise CreateProductError(f"Product creation failed: {json.get('errors')}")
        return Product.from_json(json)
    except (RequestException, JSONDecodeError, ParseProductError) as e:
        raise CreateProductError(f"Product creation failed: {e}")


def get_product_mapping(product_id: UUID, get=_get) -> Product | None:
    try:
        with ExternalServiceMetric(METRIC_SERVICE_NAME, "GET", "/product/{product_id}/mapping") as metric:
            response = get(
                url=urljoin(_get_base_url(), f"{str(product_id)}/mapping"),
                headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            metric.response_status = response.status_code

        json = response.json()
        if response.status_code == 404:
            return None
        if response.status_code != 200:
            raise GetProductMappingError(f"Fetching product mapping failed: {json.get('errors')}")
        return Product.from_json(json)
    except (RequestException, JSONDecodeError, ParseProductError) as e:
        raise GetProductMappingError(f"Fetching product mapping failed: {e}")


def create_or_update_accounting(product_id: UUID, params: CreateOrUpdateAccountingParams, post=_post) -> Accounting:
    """
    Be aware that this endpoint allows creating accouting data for products that
    do not exist. This is intentional, since in some uses cases there is a need
    to create accounting information before product information.

    It is up to us to make sure that the product does exists.
    Otherwise payments will fail.
    """
    try:
        with ExternalServiceMetric(METRIC_SERVICE_NAME, "POST", "/product/{product_id}/accounting") as metric:
            response = post(
                url=urljoin(_get_base_url(), f"{product_id}/accounting"),
                json=params.to_json(),
                headers={
                    "api-key": settings.VERKKOKAUPPA_API_KEY,
                    "namespace": settings.VERKKOKAUPPA_NAMESPACE,
                },
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            metric.response_status = response.status_code

        json = response.json()
        if response.status_code == 201:
            return Accounting.from_json(json)

        raise CreateOrUpdateAccountingError(f"Creating or updating accounting failed: {json.get('errors')}")

    except (RequestException, JSONDecodeError, ParseAccountingError) as e:
        raise CreateOrUpdateAccountingError(f"Creating or updating accounting failed: {e}")
