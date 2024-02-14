from json import JSONDecodeError
from urllib.parse import urljoin
from uuid import UUID

from django.conf import settings
from requests import RequestException
from requests import get as _get
from requests import post as _post

from merchants.verkkokauppa.constants import REQUEST_TIMEOUT_SECONDS
from merchants.verkkokauppa.exceptions import VerkkokauppaConfigurationError
from merchants.verkkokauppa.merchants.exceptions import (
    CreateMerchantError,
    GetMerchantError,
    ParseMerchantError,
    UpdateMerchantError,
)
from merchants.verkkokauppa.merchants.types import CreateMerchantParams, Merchant, MerchantInfo, UpdateMerchantParams


def _get_base_url():
    if not settings.VERKKOKAUPPA_MERCHANT_API_URL or not settings.VERKKOKAUPPA_API_KEY:
        raise VerkkokauppaConfigurationError

    if settings.VERKKOKAUPPA_MERCHANT_API_URL.endswith("/"):
        return settings.VERKKOKAUPPA_MERCHANT_API_URL

    return f"{settings.VERKKOKAUPPA_MERCHANT_API_URL}/"


def create_merchant(params: CreateMerchantParams, post=_post) -> Merchant:
    try:
        response = post(
            url=urljoin(
                _get_base_url(),
                f"create/merchant/{settings.VERKKOKAUPPA_NAMESPACE}",
            ),
            json=params.to_json(),
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

        json = response.json()
        if response.status_code != 201:
            raise CreateMerchantError(f"Merchant creation failed: {json.get('errors')}")
        return Merchant.from_json(json)
    except (RequestException, JSONDecodeError, ParseMerchantError) as e:
        raise CreateMerchantError("Merchant creation failed") from e


def update_merchant(merchant_uuid: UUID, params: UpdateMerchantParams, post=_post) -> Merchant:
    try:
        response = post(
            url=urljoin(
                _get_base_url(),
                f"update/merchant/{settings.VERKKOKAUPPA_NAMESPACE}/{merchant_uuid!s}",
            ),
            json=params.to_json(),
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

        json = response.json()
        if response.status_code == 404:
            raise UpdateMerchantError(f"Merchant update failed: merchant {merchant_uuid!s} not found")
        if response.status_code != 200:
            raise UpdateMerchantError(f"Merchant update failed: {json.get('errors')}")

        return Merchant.from_json(json)
    except (RequestException, JSONDecodeError, ParseMerchantError) as e:
        raise UpdateMerchantError("Merchant update failed") from e


def get_merchant(merchant_uuid: UUID, get=_get) -> MerchantInfo | None:
    try:
        response = get(
            url=urljoin(_get_base_url(), f"{settings.VERKKOKAUPPA_NAMESPACE}/{merchant_uuid!s}"),
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

        json = response.json()

        if response.status_code == 404:
            return None

        if response.status_code != 200:
            raise GetMerchantError(f"Fetching merchant {merchant_uuid!s} failed: {json.get('errors')}")

        return MerchantInfo.from_json(json)
    except (RequestException, JSONDecodeError, ParseMerchantError) as e:
        raise GetMerchantError(f"Fetching merchant {merchant_uuid!s} failed: {e}") from e
