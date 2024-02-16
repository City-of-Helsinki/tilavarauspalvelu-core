from django.urls import path
from django.views.decorators.csrf import csrf_exempt

from merchants.mock_verkkokauppa_api.views import MockVerkkokauppaView

urlpatterns = [
    path("<str:order_uuid>/", csrf_exempt(MockVerkkokauppaView.as_view()), name="mock_verkkokauppa"),
    path("<str:order_uuid>/paymentmethod", csrf_exempt(MockVerkkokauppaView.as_view()), name="mock_verkkokauppa_2"),
]
