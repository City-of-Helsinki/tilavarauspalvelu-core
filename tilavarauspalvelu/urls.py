from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from api.urls import router as api_router
from api.urls import urlpatterns as other_patterns  # GraphQL and GDPR api.

urlpatterns = [
    path("admin/", admin.site.urls),
    path("v1/", include(api_router.urls)),
    path("openapi/", SpectacularAPIView.as_view(), name="schema"),
    path("swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema")),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema")),
    path("pysocial/", include("social_django.urls", namespace="social")),
    path("helauth/", include("helusers.urls")),
    path("tinymce/", include("tinymce.urls")),
    path("", include("django_prometheus.urls")),
]
urlpatterns.extend(other_patterns)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
