from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from django.utils.translation import override
from helsinki_gdpr.views import DryRunSerializer, GDPRAPIView, GDPRScopesPermission
from rest_framework import status
from rest_framework.response import Response

from users.anonymisation import anonymize_user_data, can_user_be_anonymized
from users.models import ProfileUser
from utils.sentry import SentryLogger

if TYPE_CHECKING:
    from promise import Promise
    from rest_framework.request import Request


class AnonymizationNotAllowedError(Exception):
    pass


class GDPRScopesAndLOAPermission(GDPRScopesPermission):
    def has_permission(self, request: Request, view: TilavarauspalveluGDPRAPIView) -> bool:
        has_permission = super().has_permission(request, view)
        if has_permission:
            # Ensure request is made with by a strongly authenticated user,
            # following best practices set by the City of Helsinki.
            return request.auth.data.get("loa", "").lower() in ("substantial", "high")
        return False


class TilavarauspalveluGDPRAPIView(GDPRAPIView):
    permission_classes = [GDPRScopesAndLOAPermission]

    def get_object(self) -> ProfileUser:
        profile = get_object_or_404(ProfileUser, uuid=self.kwargs["uuid"])
        self.check_object_permissions(self.request, profile)
        return profile

    @staticmethod
    def get_error_message(*, code: str, message: Promise) -> dict[str, Any]:
        with override("en"):
            message_en = str(message)
        with override("fi"):
            message_fi = str(message)
        with override("sv"):
            message_sv = str(message)

        return {
            "code": code,
            "message": {
                "en": message_en,
                "fi": message_fi,
                "sv": message_sv,
            },
        }

    def _delete_and_anonymize(self) -> Response:
        profile_user = self.get_object()
        can_anonymize = can_user_be_anonymized(profile_user.user)
        if not can_anonymize:
            errors = []
            if can_anonymize.has_open_reservations:
                errors.append(
                    self.get_error_message(
                        code="RESERVATION",
                        message=_("User has upcoming or too recent reservations."),
                    )
                )
            if can_anonymize.has_open_applications:
                errors.append(
                    self.get_error_message(
                        code="APPLICATION",
                        message=_("User has an unhandled application."),
                    ),
                )
            if can_anonymize.has_open_payments:
                errors.append(
                    self.get_error_message(
                        code="PAYMENT",
                        message=_("User has open payments."),
                    ),
                )

            return Response(data={"errors": errors}, status=status.HTTP_403_FORBIDDEN)

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

    def handle_exception(self, exc: Exception) -> Response:
        try:
            response: Response = super().handle_exception(exc)
        except Exception as error:
            SentryLogger.log_exception(error, details="Uncaught error in GDPR API")
            raise

        SentryLogger.log_message("GDPR API query failed.", details=response.data)
        return response
