from typing import Dict

from pytest import fixture

from ..product.types import CreateProductParams


@fixture(autouse=True)
def setup_audit_log(settings):
    settings.VERKKOKAUPPA_API_KEY = "test-api-key"
    settings.VERKKOKAUPPA_PRODUCT_API_URL = "http://test-product:1234"
    settings.VERKKOKAUPPA_ORDER_API_URL = "http://test-order:1234"
    settings.VERKKOKAUPPA_PAYMENT_API_URL = "http://test-payment:1234"
    settings.VERKKOKAUPPA_MERCHANT_API_URL = "http://test-merchant:1234"
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"


@fixture
def create_product_params() -> CreateProductParams:
    return CreateProductParams(
        namespace="test-namespace",
        namespace_entity_id="test-namespace-entity-id",
        merchant_id="be4154c7-9f66-4625-998b-18abac4ecae7",
    )


@fixture
def response() -> Dict[str, str]:
    return {
        "productId": "306ab20a-6b30-3ce3-95e8-fef818e6c30e",
        "namespace": "test-namespace",
        "namespaceEntityId": "test-namespace-entity-id",
        "merchantId": "be4154c7-9f66-4625-998b-18abac4ecae7",
    }
