from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils.translation import gettext_lazy as _
from django.utils.translation import override
from helsinki_gdpr.views import DryRunSerializer, GDPRAPIView
from rest_framework import status
from rest_framework.exceptions import NotAuthenticated, PermissionDenied
from rest_framework.permissions import BasePermission
from rest_framework.response import Response

from users.anonymisation import anonymize_user_data, can_user_be_anonymized
from users.models import ProfileUser
from utils.sentry import SentryLogger

if TYPE_CHECKING:
    from promise import Promise
    from rest_framework.request import Request


class GDPRScopesAndLOAPermission(BasePermission):
    # Reimplement `helsinki_gdpr.views.GDPRScopesPermission` to add better logging for permission errors.

    def has_permission(self, request: Request, view: TilavarauspalveluGDPRAPIView) -> bool:
        request_method = str(request.method)
        authenticated = bool(request.user and request.user.is_authenticated)
        if not authenticated:
            SentryLogger.log_message(f"GDPR API {request_method} request not authenticated.")
            return False

        # Ensure request is made with by a strongly authenticated user,
        # following best practices set by the City of Helsinki.
        loa = request.auth.data.get("loa", "").lower()
        allowed_loa = ["substantial", "high"]
        has_correct_loa = loa in allowed_loa

        details = {
            "request_method": request_method,
            "allowed_loa": allowed_loa,
            "required_query_scope": settings.GDPR_API_QUERY_SCOPE,
            "required_delete_scope": settings.GDPR_API_DELETE_SCOPE,
            "auth_claims": request.auth.data,
        }

        if request.method == "GET":
            has_query_scope = request.auth.has_api_scopes(settings.GDPR_API_QUERY_SCOPE)
            if has_query_scope and has_correct_loa:
                return True

            SentryLogger.log_message(f"GDPR API {request_method} permission check failed.", details=details)
            return False

        if request.method == "DELETE":
            has_delete_scope = request.auth.has_api_scopes(settings.GDPR_API_DELETE_SCOPE)
            if has_delete_scope and has_correct_loa:
                return True

            SentryLogger.log_message(f"GDPR API {request_method} permission check failed.", details=details)
            return False

        return False

    def has_object_permission(self, request: Request, view: TilavarauspalveluGDPRAPIView, obj: ProfileUser) -> bool:
        if request.user == obj.user:
            return True

        details = {
            "request_user_id": str(request.user.id),
            "request_user_uuid": str(request.user.uuid),
            "target_user_id": str(obj.user.id),
            "target_user_uuid": str(obj.user.uuid),
        }
        SentryLogger.log_message(f"GDPR API {request.method} request can't access data for user.", details=details)
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

        # These exceptions are already logged in the permission class.
        if isinstance(exc, NotAuthenticated | PermissionDenied):
            return response

        SentryLogger.log_message("GDPR API query failed.", details=response.data)
        return response
