from django.urls import path
from django.views.decorators.csrf import csrf_exempt

from .views import MockVerkkokauppaView

mock_verkkokauppa_view = csrf_exempt(MockVerkkokauppaView.as_view())  # NOSONAR

urlpatterns = [
    path("<str:order_uuid>/", mock_verkkokauppa_view, name="mock_verkkokauppa"),
    path("<str:order_uuid>/paymentmethod", mock_verkkokauppa_view, name="mock_verkkokauppa_paymentmethod"),
]
