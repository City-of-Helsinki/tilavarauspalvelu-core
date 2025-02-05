# This file exists so that we can use a custom `TunnistamoOIDCAuth` backend.
# See `config.auth.ProxyTunnistamoOIDCAuthBackend` for more details.
# Using `helusers/urls.py` will not add the URLs to the file's `urlpatterns` unless
# `helusers.tunnistamo_oidc.TunnistamoOIDCAuth` is specifically included in the
# `AUTHENTICATION_BACKENDS` setting.
from __future__ import annotations

from django.urls import path

from .views import login_view, logout_view

app_name = "helusers"

urlpatterns = [
    path("login/", login_view, name="auth_login"),
    path("logout/", logout_view, name="auth_logout"),
]
