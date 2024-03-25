from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from graphene_file_upload.django import FileUploadGraphQLView

from api.legacy_rest_api.urls import legacy_outer
from api.webhooks.urls import webhook_router

# Mock the autocomplete view to be able to include `extra_context` for other pages
real_autocomplete_view = admin.site.autocomplete_view
admin.site.autocomplete_view = lambda request, extra_context: real_autocomplete_view(request)

# Mock the catch-all view to be able to include `extra_context` for other pages
real_catch_all_view = admin.site.catch_all_view
admin.site.catch_all_view = lambda request, url, extra_context: real_catch_all_view(request, url)

urlpatterns = [
    path("graphql/", FileUploadGraphQLView.as_view(graphiql=settings.DEBUG)),
    path("admin/", admin.site.urls, {"extra_context": {"version": settings.APP_VERSION}}),
    path("v1/", include(legacy_outer.urls)),
    path("v1/webhook/", include(webhook_router.urls)),
    path("pysocial/", include("social_django.urls", namespace="social")),
    path("helauth/", include("api.helauth.urls")),
    path("gdpr/v1/", include("api.gdpr.urls")),
    path("tinymce/", include("tinymce.urls")),
]

if settings.MOCK_VERKKOKAUPPA_API_ENABLED:
    urlpatterns.append(path("mock_verkkokauppa/", include("merchants.mock_verkkokauppa_api.urls")))

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    if "debug_toolbar" in settings.INSTALLED_APPS:
        urlpatterns += [path("__debug__/", include("debug_toolbar.urls"))]
