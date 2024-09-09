from django.conf import settings
from django.contrib import messages
from django.contrib.auth import logout
from django.http import HttpResponseRedirect
from django.utils.translation import gettext_lazy as _
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST

from common.typing import TypeHintedWSGIRequest
from common.utils import update_query_params


@require_POST
@csrf_protect
@never_cache
def logout_view(request: TypeHintedWSGIRequest) -> HttpResponseRedirect:
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

    return HttpResponseRedirect(end_session_url)
