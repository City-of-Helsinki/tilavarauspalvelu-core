from typing import Any, Dict

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


@fixture
def get_payment_response() -> Dict[str, Any]:
    return {
        "paymentId": "08c2d282-eb98-3271-a3fc-81fe200f129b_at_20211115-122645",
        "namespace": "tilavarauspalvelu",
        "orderId": "08c2d282-eb98-3271-a3fc-81fe200f129b",
        "userId": "Esperanza_Daniel23",
        "status": "payment_created",
        "paymentMethod": "nordea",
        "paymentType": "order",
        "totalExclTax": 100,
        "total": 124,
        "taxAmount": 24,
        "description": "Test description",
        "additionalInfo": '{"payment_method": nordea}',
        "token": "354477a1a009a1514fa3cc1132179a60163f5650aaf27ec98bb98158b04e0a63",
        "timestamp": "20211115-122645",
        "paymentMethodLabel": "Nordea",
    }
