from json import JSONDecodeError

from django.conf import settings
from requests import RequestException
from requests import post as _post

from ..constants import REQUEST_TIMEOUT_SECONDS
from .exceptions import CreateProductError, ParseProductError
from .types import CreateProductParams, Product


def create_product(params: CreateProductParams, post=_post) -> Product:
    try:
        response = post(
            url=settings.VERKKOKAUPPA_PRODUCT_API_URL,
            json=params.to_json(),
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        json = response.json()
        if response.status_code != 201:
            raise CreateProductError(f"Product creation failed: {json.get('errors')}")
        return Product.from_json(json)
    except (RequestException, JSONDecodeError, ParseProductError) as e:
        raise CreateProductError("Product creation failed") from e
