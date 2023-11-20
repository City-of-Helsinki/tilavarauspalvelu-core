from django.urls import path

from api.helauth.views import TVPLoginView, TVPLogoutCompleteView, TVPLogoutView

app_name = "helusers"

urlpatterns = [
    path("login/", TVPLoginView.as_view(), name="auth_login"),
    path("logout/", TVPLogoutView.as_view(), name="auth_logout"),
    path("logout/complete/", TVPLogoutCompleteView.as_view(), name="auth_logout_complete"),
]
