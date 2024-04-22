from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.core.handlers.wsgi import WSGIRequest
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.urls import include, path, reverse
from django.views.decorators.csrf import csrf_exempt
from graphene_django_extensions import FileUploadGraphQLView

from api.legacy_rest_api.urls import legacy_outer
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


def csrf_view(request: WSGIRequest) -> JsonResponse:  # NOSONAR
    """Return a CSRF token for the frontend to use."""
    # From: https://fractalideas.com/blog/making-react-and-django-play-well-together-single-page-app-model/
    # > You may wonder whether this endpoint creates a security vulnerability.
    # > From a security perspective, it's no different from any page that contains
    # > the CSRF token on a traditional Django website. The browser's same-origin policy
    # > prevents an attacker from getting access to the token with a cross-origin request.
    #
    # Set these META-flags to force `django.middleware.csrf.CsrfViewMiddleware` to update the CSRF cookie.
    request.META["CSRF_COOKIE_NEEDS_UPDATE"] = True
    request.META["CSRF_COOKIE"] = csrf = get_token(request)
    return JsonResponse({"csrfToken": csrf})


# Make it possible to turn off CSRF protection for the GraphQL endpoint for frontend graphql codegen
graphql_view = FileUploadGraphQLView.as_view(graphiql=settings.DEBUG)
if settings.GRAPHQL_CODEGEN_ENABLED:
    graphql_view = csrf_exempt(graphql_view)  # NOSONAR

urlpatterns = [
    path("graphql/", graphql_view),
    path("admin/", admin.site.urls),
    path("v1/", include(legacy_outer.urls)),
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
