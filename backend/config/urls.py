from __future__ import annotations

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path, reverse
from graphene_django_extensions import FileUploadGraphQLView

from tilavarauspalvelu.api.gdpr.views import TilavarauspalveluGDPRAPIView
from tilavarauspalvelu.api.rest.views import (
    csrf_view,
    liveness_check,
    readiness_check,
    redirect_to_verkkokauppa_for_pending_reservations,
    reservable_time_spans_export,
    reservation_ical,
    reservation_statistics_export,
    reservation_unit_export,
    terms_of_use_pdf,
)
from tilavarauspalvelu.api.webhooks.urls import webhook_router

# Mock the `each_context` method to add some custom context variables.
original_each_context = admin.site.each_context
admin.site.each_context = lambda request: original_each_context(request) | {
    "version": settings.APP_VERSION,
    # The helauth variables need to be added, since we subclass `helusers.tunnistamo_oidc.TunnistamoOIDCAuth`
    # with `config.auth.ProxyTunnistamoOIDCAuthBackend` for optimizing request user fetching.
    # `helusers.admin_site.AdminSite.each_context` refers to the original backend by
    # string reference, so subclasses won't have the login/logout urls added.
    "helsinki_provider_installed": True,
    "helsinki_login_url": reverse("helusers:auth_login"),
    "helsinki_logout_url": reverse("helusers:auth_logout"),
}

urlpatterns = [
    path("graphql/", FileUploadGraphQLView.as_view(graphiql=settings.DEBUG)),
    path("admin/", admin.site.urls),
    path("v1/reservation_calendar/<int:pk>/", reservation_ical, name="reservation_calendar"),
    path(
        "v1/pay_pending_reservation/<int:pk>/",
        redirect_to_verkkokauppa_for_pending_reservations,
        name="verkkokauppa_pending_reservation",
    ),
    path("v1/terms_of_use_pdf/", terms_of_use_pdf, name="terms_of_use_pdf"),
    path("v1/webhook/", include(webhook_router.urls)),
    path("v1/palvelukartta/", include("tilavarauspalvelu.api.palvelukartta.urls")),
    path("pysocial/", include("social_django.urls", namespace="social")),
    path("helauth/", include("tilavarauspalvelu.api.helauth.urls")),
    re_path(
        # GDPR UUID's are v1, not v4!
        r"gdpr/v1/user/(?P<uuid>[\da-fA-F]{8}-[\da-fA-F]{4}-[\da-fA-F]{4}-[\da-fA-F]{4}-[\da-fA-F]{12})/?$",
        TilavarauspalveluGDPRAPIView.as_view(),
        name="gdpr_v1",
    ),
    path("tinymce/", include("tinymce.urls")),
    path("csrf/", csrf_view),
    path("monitoring/system-status/", include("health_check.urls", namespace="health_check")),
    path("monitoring/liveness/", liveness_check, name="liveness_check"),
    path("monitoring/readiness/", readiness_check, name="readiness_check"),
    path("v1/reports/reservation-units/", reservation_unit_export, name="reservation_unit_export"),
    path("v1/reports/reservation-statistics/", reservation_statistics_export, name="reservation_statistics_export"),
    path("v1/reports/reservable-time-spans/", reservable_time_spans_export, name="reservable_time_spans_export"),
]

if settings.MOCK_VERKKOKAUPPA_API_ENABLED:
    urlpatterns.append(
        path(
            "mock_verkkokauppa/",
            include("tilavarauspalvelu.api.mock_verkkokauppa_api.urls", namespace="mock_verkkokauppa"),
        ),
    )

if settings.FRONTEND_TESTING_API_ENABLED:
    urlpatterns.append(
        path(
            "testing/",
            include("tilavarauspalvelu.api.frontend_testing_api.urls", namespace="frontend_testing_api"),
        ),
    )

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
