import pytest

from merchants.verkkokauppa.product.types import CreateProductParams


@pytest.fixture()
def create_product_params() -> CreateProductParams:
    return CreateProductParams(
        namespace="test-namespace",
        namespace_entity_id="test-namespace-entity-id",
        merchant_id="be4154c7-9f66-4625-998b-18abac4ecae7",
    )


@pytest.fixture()
def response() -> dict[str, str]:
    return {
        "productId": "306ab20a-6b30-3ce3-95e8-fef818e6c30e",
        "namespace": "test-namespace",
        "namespaceEntityId": "test-namespace-entity-id",
        "merchantId": "be4154c7-9f66-4625-998b-18abac4ecae7",
    }
