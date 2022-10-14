from json import JSONDecodeError
from typing import Optional
from uuid import UUID

from django.conf import settings
from requests import RequestException
from requests import get as _get
from requests import post as _post

from ..constants import REQUEST_TIMEOUT_SECONDS
from .exceptions import CreateProductError, GetProductMappingError, ParseProductError
from .types import CreateProductParams, Product


def create_product(params: CreateProductParams, post=_post) -> Product:
    try:
        response = post(
            url=settings.VERKKOKAUPPA_PRODUCT_API_URL + "/",
            json=params.to_json(),
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        json = response.json()
        if response.status_code != 201:
            raise CreateProductError(f"Product creation failed: {json.get('errors')}")
        return Product.from_json(json)
    except (RequestException, JSONDecodeError, ParseProductError) as e:
        raise CreateProductError(f"Product creation failed: {e}")


def get_product_mapping(product_id: UUID, get=_get) -> Optional[Product]:
    try:
        response = get(
            url=(settings.VERKKOKAUPPA_PRODUCT_API_URL + f"/{str(product_id)}/mapping"),
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        json = response.json()
        if response.status_code == 404:
            return None
        if response.status_code != 200:
            raise GetProductMappingError(
                f"Fetching product mapping failed: {json.get('errors')}"
            )
        return Product.from_json(json)
    except (RequestException, JSONDecodeError, ParseProductError) as e:
        raise GetProductMappingError(f"Fetching product mapping failed: {e}")
