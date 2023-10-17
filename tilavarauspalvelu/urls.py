from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from django.views.decorators.csrf import csrf_exempt
from graphene_file_upload.django import FileUploadGraphQLView

from api.legacy_rest_api.urls import legacy_outer
from api.webhooks.urls import webhook_router
from users.views import TilavarauspalveluGDPRAPIView, TVPLoginView, TVPLogoutCompleteView, TVPLogoutView

helusers_pattern = (
    [
        path("login/", TVPLoginView.as_view(), name="auth_login"),
        path("logout/", TVPLogoutView.as_view(), name="auth_logout"),
        path("logout/complete/", TVPLogoutCompleteView.as_view(), name="auth_logout_complete"),
    ],
    "helusers",
)

urlpatterns = [
    path("graphql/", csrf_exempt(FileUploadGraphQLView.as_view(graphiql=settings.DEBUG))),  # NOSONAR
    path("admin/", admin.site.urls),
    path("v1/", include(legacy_outer.urls)),
    path("v1/webhook/", include(webhook_router.urls)),
    path("gdpr/v1/user/<str:uuid>/", TilavarauspalveluGDPRAPIView.as_view(), name="gdpr_v1"),
    path("pysocial/", include("social_django.urls", namespace="social")),
    path("helauth/", include(helusers_pattern)),
    path("tinymce/", include("tinymce.urls")),
    path("", include("django_prometheus.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    if "debug_toolbar" in settings.INSTALLED_APPS:
        urlpatterns += [path("__debug__/", include("debug_toolbar.urls"))]
