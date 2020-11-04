from django.contrib import admin
from django.urls import path, include

from api.urls import router as api_router


urlpatterns = [
    path("admin/", admin.site.urls),
    path("v1/", include(api_router.urls)),
]
