from __future__ import annotations

from typing import TYPE_CHECKING

from django.conf import settings
from django.contrib import messages
from django.contrib.auth import logout
from django.http import HttpResponseRedirect
from django.shortcuts import redirect, render
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from django.views.decorators.cache import never_cache
from django.views.decorators.clickjacking import xframe_options_deny
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_http_methods, require_POST

from utils.utils import update_query_params

if TYPE_CHECKING:
    from django.http import HttpResponse

    from tilavarauspalvelu.typing import WSGIRequest


@require_http_methods(["GET", "POST"])
@xframe_options_deny
@never_cache
def login_view(request: WSGIRequest) -> HttpResponse:
    # We make sure the user is logged out first, because otherwise
    # PSA will enter the connect flow where a new social authentication
    # method is connected to an existing user account.
    logout(request)

    begin_url = reverse("social:begin", kwargs={"backend": "tunnistamo"})

    # The 'Helsinki Login' button on the admin login page posts here with a CSRF token.
    # A 307 redirect makes the browser send the same POST to PSA.
    if request.method == "POST":
        return redirect(begin_url, preserve_request=True)

    params: dict[str, str] = {}

    redirect_to: str | None = request.GET.get("next")
    if redirect_to:
        params["next"] = redirect_to

    lang: str | None = request.GET.get("lang")
    if lang:
        params["ui_locales"] = lang

    login_method_hint: str | None = request.GET.get("ui")
    if login_method_hint == "customer":
        # For `kc_idp_hint`, see: https://www.keycloak.org/docs/latest/server_admin/#_client_suggested_idp
        params["kc_idp_hint"] = "suomi_fi"

    # PSA starts a login only from a POST with a CSRF token, but the frontends link here with a GET.
    # This page sends that POST from the browser.
    context = {
        "action_url": begin_url,
        "params": params,
    }
    return render(request, "helauth/login.html", context)


@require_POST
@csrf_protect
@never_cache
def logout_view(request: WSGIRequest) -> HttpResponseRedirect:
    """View hit when logout from Keycloak begins."""
    was_authenticated = request.user.is_authenticated

    redirect_to = request.POST.get("redirect_to")
    if redirect_to is None:
        redirect_to = request.build_absolute_uri(settings.LOGOUT_REDIRECT_URL)

    # Added in `helusers.pipeline.store_end_session_url`
    end_session_url: str | None = request.session.get("social_auth_end_session_url")

    if end_session_url is None or end_session_url == request.get_full_path():
        end_session_url = redirect_to
    else:
        end_session_url = update_query_params(end_session_url, post_logout_redirect_uri=redirect_to)

    logout(request)

    if was_authenticated:
        messages.success(request, _("You have been successfully logged out."))

    return HttpResponseRedirect(end_session_url)  # NOSONAR
