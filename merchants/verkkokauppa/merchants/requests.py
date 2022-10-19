from json import JSONDecodeError
from typing import List, Optional
from uuid import UUID

from django.conf import settings
from requests import RequestException
from requests import get as _get
from requests import post as _post

from ..constants import REQUEST_TIMEOUT_SECONDS
from .exceptions import (
    CreateMerchantError,
    GetMerchantError,
    GetMerchantsError,
    ParseMerchantError,
    UpdateMerchantError,
)
from .types import CreateMerchantParams, Merchant, MerchantInfo, UpdateMerchantParams


def create_merchant(params: CreateMerchantParams, post=_post) -> Merchant:
    try:
        response = post(
            url=f"{settings.VERKKOKAUPPA_MERCHANT_API_URL}/create/merchant/{settings.VERKKOKAUPPA_NAMESPACE}",
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


def update_merchant(id: UUID, params: UpdateMerchantParams, post=_post) -> Merchant:
    try:
        response = post(
            url=(
                settings.VERKKOKAUPPA_MERCHANT_API_URL
                + "/update/merchant/"
                + f"{settings.VERKKOKAUPPA_NAMESPACE}/{str(id)}"
            ),
            json=params.to_json(),
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        json = response.json()
        if response.status_code == 404:
            raise UpdateMerchantError(
                f"Merchant update failed: merchant {str(id)} not found"
            )
        if response.status_code != 200:
            raise UpdateMerchantError(f"Merchant update failed: {json.get('errors')}")

        return Merchant.from_json(json)
    except (RequestException, JSONDecodeError, ParseMerchantError) as e:
        raise UpdateMerchantError("Merchant update failed") from e


def get_merchants(get=_get) -> List[Merchant]:
    try:
        response = get(
            url=f"{settings.VERKKOKAUPPA_MERCHANT_API_URL}/list/merchants/{settings.VERKKOKAUPPA_NAMESPACE}",
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        json = response.json()
        if response.status_code != 200:
            raise GetMerchantsError(f"Fetching merchants failed: {json.get('errors')}")

        result = []
        for merchant_data in json.values():
            result.append(Merchant.from_json(merchant_data))
        return result
    except (RequestException, JSONDecodeError, ParseMerchantError) as e:
        raise GetMerchantsError("Fetching merchants failed") from e


def get_merchant(id: UUID, get=_get) -> Optional[MerchantInfo]:
    try:
        response = get(
            url=f"{settings.VERKKOKAUPPA_MERCHANT_API_URL}/{settings.VERKKOKAUPPA_NAMESPACE}/{str(id)}",
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        json = response.json()

        if response.status_code == 404:
            return None

        if response.status_code != 200:
            raise GetMerchantError(
                f"Fetching merchant {str(id)} failed: {json.get('errors')}"
            )

        return MerchantInfo.from_json(json)
    except (RequestException, JSONDecodeError, ParseMerchantError) as e:
        raise GetMerchantError(f"Fetching merchant {str(id)} failed: {e}") from e
