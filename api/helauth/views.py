import helusers.views
from django.conf import settings


class TVPLoginView(helusers.views.LoginView):
    pass


class TVPLogoutView(helusers.views.LogoutView):
    success_url_allowed_hosts = settings.SOCIAL_AUTH_TUNNISTAMO_ALLOWED_REDIRECT_HOSTS


class TVPLogoutCompleteView(helusers.views.LogoutCompleteView):
    success_url_allowed_hosts = settings.SOCIAL_AUTH_TUNNISTAMO_ALLOWED_REDIRECT_HOSTS
