from django.dispatch import Signal
from helusers.oidc import ApiTokenAuthentication
from rest_framework.exceptions import AuthenticationFailed

token_authentication_successful = Signal()
token_authentication_failed = Signal()


class GraphQLApiTokenAuthentication(ApiTokenAuthentication):
    """
    Custom wrapper for the helusers.oidc.ApiTokenAuthentication backend.
    Needed to make it work with graphql_jwt.middleware.JSONWebTokenMiddleware,
    which in turn calls django.contrib.auth.middleware.AuthenticationMiddleware.
    Authenticate function should:
    1. accept kwargs, or django's auth middleware will not call it
    2. return only the user object, or django's auth middleware will fail
    """

    def authenticate(self, request, **kwargs):
        try:
            user_auth_tuple = super().authenticate(request)
        except AuthenticationFailed as e:
            token_authentication_failed.send(
                sender=__name__, error=e.detail, request=request
            )
            raise
        if not user_auth_tuple:
            return None
        user, auth = user_auth_tuple
        token_authentication_successful.send(
            sender=__name__, user=user, request=request
        )
        return user
