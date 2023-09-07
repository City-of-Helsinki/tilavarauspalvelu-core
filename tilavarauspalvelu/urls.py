from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)
from helusers import views

from api.urls import router as api_router
from api.urls import urlpatterns as other_patterns  # GraphQL and GDPR api.


class TVPLogoutView(views.LogoutView):
    success_url_allowed_hosts = settings.SOCIAL_AUTH_TUNNISTAMO_ALLOWED_REDIRECT_HOSTS


class TVPLogoutCompleteView(views.LogoutCompleteView):
    success_url_allowed_hosts = settings.SOCIAL_AUTH_TUNNISTAMO_ALLOWED_REDIRECT_HOSTS


helusers_pattern = (
    [
        path("login/", views.LoginView.as_view(), name="auth_login"),
        path("logout/", TVPLogoutView.as_view(), name="auth_logout"),
        path("logout/complete/", TVPLogoutCompleteView.as_view(), name="auth_logout_complete"),
    ],
    "helusers",
)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("v1/", include(api_router.urls)),
    path("openapi/", SpectacularAPIView.as_view(), name="schema"),
    path("swagger-ui/", SpectacularSwaggerView.as_view(url_name="schema")),
    path("redoc/", SpectacularRedocView.as_view(url_name="schema")),
    path("pysocial/", include("social_django.urls", namespace="social")),
    path("helauth/", include(helusers_pattern)),
    path("tinymce/", include("tinymce.urls")),
    path("", include("django_prometheus.urls")),
]
urlpatterns.extend(other_patterns)

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    if "debug_toolbar" in settings.INSTALLED_APPS:
        urlpatterns += [path("__debug__/", include("debug_toolbar.urls"))]
