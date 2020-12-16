from rest_framework.permissions import IsAuthenticatedOrReadOnly

from tilavarauspalvelu import settings


class AuthenticationOffOrAuthenticatedForWrite(IsAuthenticatedOrReadOnly):
    def has_permission(self, request, view):
        if (
            hasattr(settings, "TMP_PERMISSIONS_DISABLED")
            and settings.TMP_PERMISSIONS_DISABLED is True
        ):
            return True
        return super().has_permission(request, view)
