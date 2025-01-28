from __future__ import annotations

from django.urls import include, path
from rest_framework import routers

app_name = "frontend_testing_api"

router = routers.DefaultRouter()

urlpatterns = [
    path("", include(router.urls)),
]
