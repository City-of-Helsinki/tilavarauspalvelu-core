import pytest


@pytest.fixture(autouse=True)
def _toggle_elasticsearch(request, settings):
    """Enable or disable syncing to Elasticsearch for the duration of the test."""
    use_elasticsearch = "elasticsearch" in request.keywords

    settings.SEARCH_SETTINGS["settings"]["auto_sync"] = use_elasticsearch


@pytest.fixture()
def _setup_verkkokauppa_env_variables(settings):
    settings.VERKKOKAUPPA_API_KEY = "test-api-key"
    settings.VERKKOKAUPPA_PRODUCT_API_URL = "http://test-product:1234"
    settings.VERKKOKAUPPA_ORDER_API_URL = "http://test-order:1234"
    settings.VERKKOKAUPPA_PAYMENT_API_URL = "http://test-payment:1234"
    settings.VERKKOKAUPPA_MERCHANT_API_URL = "http://test-merchant:1234"
    settings.VERKKOKAUPPA_NAMESPACE = "tilanvaraus"
    settings.MOCK_VERKKOKAUPPA_API_ENABLED = False
    settings.MOCK_VERKKOKAUPPA_FRONTEND_URL = "http://mock-verkkokauppa.com"
    settings.MOCK_VERKKOKAUPPA_BACKEND_URL = "http://mock-verkkokauppa.com"
