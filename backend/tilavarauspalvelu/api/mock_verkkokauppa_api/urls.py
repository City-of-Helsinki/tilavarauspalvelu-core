from django.urls import path
from django.views.decorators.csrf import csrf_exempt

from .views import MockVerkkokauppaView

mock_verkkokauppa_view = csrf_exempt(MockVerkkokauppaView.as_view())  # NOSONAR

app_name = "mock_verkkokauppa"

urlpatterns = [
    path("<str:order_uuid>/", mock_verkkokauppa_view, name="checkout"),
    path("<str:order_uuid>/paymentmethod", mock_verkkokauppa_view, name="payment_method"),
]
