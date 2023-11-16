from typing import Any

from django.db import transaction
from django.shortcuts import get_object_or_404
from helsinki_gdpr.views import DryRunSerializer, GDPRAPIView
from rest_framework import status
from rest_framework.request import Request
from rest_framework.response import Response

from users.anonymisation import anonymize_user_data, can_user_be_anonymized
from users.models import ProfileUser


class AnonymizationNotAllowedError(Exception):
    pass


class TilavarauspalveluGDPRAPIView(GDPRAPIView):
    def get_object(self) -> ProfileUser:
        profile = get_object_or_404(ProfileUser, uuid=self.kwargs["uuid"])
        self.check_object_permissions(self.request, profile)
        return profile

    def _delete_and_anonymize(self) -> Response:
        profile_user = self.get_object()
        if not can_user_be_anonymized(profile_user.user):
            return Response(status=status.HTTP_403_FORBIDDEN)

        anonymize_user_data(profile_user.user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def delete(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        dry_run_serializer = DryRunSerializer(data=request.data)
        dry_run_serializer.is_valid(raise_exception=True)

        with transaction.atomic():
            response = self._delete_and_anonymize()
            if dry_run_serializer.data["dry_run"]:
                transaction.set_rollback(True)

        return response
