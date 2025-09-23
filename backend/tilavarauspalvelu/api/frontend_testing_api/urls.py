from __future__ import annotations

from django.urls import include, path
from rest_framework import routers

from tilavarauspalvelu.api.frontend_testing_api.reservation import TestingReservationViewSet

app_name = "frontend_testing_api"

router = routers.DefaultRouter()
router.register(r"reservation", TestingReservationViewSet, basename="reservation")

urlpatterns = [
    path("", include(router.urls)),
]
