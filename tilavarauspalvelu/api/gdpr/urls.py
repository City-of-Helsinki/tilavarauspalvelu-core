from django.urls import path

from tilavarauspalvelu.api.gdpr.views import TilavarauspalveluGDPRAPIView

urlpatterns = [
    path("user/<str:uuid>/", TilavarauspalveluGDPRAPIView.as_view(), name="gdpr_v1"),
]
