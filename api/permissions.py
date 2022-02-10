from django.conf import settings
from rest_framework.permissions import IsAuthenticatedOrReadOnly


class AuthenticationOffOrAuthenticatedForWrite(IsAuthenticatedOrReadOnly):
    def has_permission(self, request, view):
        if (
            hasattr(settings, "TMP_PERMISSIONS_DISABLED")
            and settings.TMP_PERMISSIONS_DISABLED is True
        ):
            return True

        return super().has_permission(request, view)
