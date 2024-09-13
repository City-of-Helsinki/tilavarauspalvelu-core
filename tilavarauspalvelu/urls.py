from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, reverse
from django.views.decorators.csrf import csrf_exempt
from graphene_django_extensions import FileUploadGraphQLView

from api.rest.views import csrf_view, reservation_ical, terms_of_use_pdf
from api.webhooks.urls import webhook_router

# Mock the `each_context` method to add some custom context variables.
original_each_context = admin.site.each_context
admin.site.each_context = lambda request: original_each_context(request) | {
    "version": settings.APP_VERSION,
    # The helauth variables need to be added, since we subclass `helusers.tunnistamo_oidc.TunnistamoOIDCAuth`
    # with `tilavarauspalvelu.auth.ProxyTunnistamoOIDCAuthBackend` for optimizing request user fetching.
    # `helusers.admin_site.AdminSite.each_context` refers to the original backend by
    # string reference, so subclasses won't have the login/logout urls added.
    "helsinki_provider_installed": True,
    "helsinki_login_url": reverse("helusers:auth_login"),
    "helsinki_logout_url": reverse("helusers:auth_logout"),
}

# Make it possible to turn off CSRF protection for the GraphQL endpoint for frontend graphql codegen
graphql_view = FileUploadGraphQLView.as_view(graphiql=settings.DEBUG)
if settings.GRAPHQL_CODEGEN_ENABLED:
    graphql_view = csrf_exempt(graphql_view)  # NOSONAR

urlpatterns = [
    path("graphql/", graphql_view),
    path("admin/", admin.site.urls),
    path("v1/reservation_calendar/<int:pk>/", reservation_ical, name="reservation_calendar"),
    path("v1/terms_of_use_pdf/", terms_of_use_pdf, name="terms_of_use_pdf"),
    path("v1/webhook/", include(webhook_router.urls)),
    path("pysocial/", include("social_django.urls", namespace="social")),
    path("helauth/", include("api.helauth.urls")),
    path("gdpr/v1/", include("api.gdpr.urls")),
    path("tinymce/", include("tinymce.urls")),
    path("csrf/", csrf_view),
]

if settings.MOCK_VERKKOKAUPPA_API_ENABLED:
    urlpatterns.append(path("mock_verkkokauppa/", include("merchants.mock_verkkokauppa_api.urls")))

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

    if "debug_toolbar" in settings.INSTALLED_APPS:
        urlpatterns += [path("__debug__/", include("debug_toolbar.urls"))]
