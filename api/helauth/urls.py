# This file exists so that we can use a custom `TunnistamoOIDCAuth` backend.
# See `tilavarauspalvelu.auth.ProxyTunnistamoOIDCAuthBackend` for more details.
# Using `helusers/urls.py` will not add the URLs to the file's `urlpatterns` unless
# `helusers.tunnistamo_oidc.TunnistamoOIDCAuth` is specifically included in the
# `AUTHENTICATION_BACKENDS` setting.
from django.urls import path
from helusers.views import LoginView

from .views import logout_view

app_name = "helusers"

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth_login"),
    path("logout/", logout_view, name="auth_logout"),
]
