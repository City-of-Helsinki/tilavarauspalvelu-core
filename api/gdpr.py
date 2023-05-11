from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from helsinki_gdpr.views import DryRunSerializer, GDPRAPIView
from rest_framework import status
from rest_framework.response import Response

from api.models import ProfileUser
from applications.models import ApplicationStatus
from merchants.models import OrderStatus
from reservations.models import STATE_CHOICES as ReservationState
from tilavarauspalvelu.utils.anonymisation import anonymize_user_data

User = get_user_model()


class AnonymizationNotAllowedError(Exception):
    pass


class TilavarauspalveluGDPRAPIView(GDPRAPIView):
    def get_object(self) -> User:
        user = get_object_or_404(User, uuid=self.kwargs["uuid"])
        profile = ProfileUser(user)

        self.check_object_permissions(self.request, profile)
        return profile

    def _delete(self):
        profile_user = self.get_object()
        if not self._check_user_can_be_anonymized(profile_user.user):
            raise AnonymizationNotAllowedError()
        anonymize_user_data(profile_user.user)

    def _check_user_can_be_anonymized(self, user):
        now = timezone.now()

        has_open_reservations = (
            user.reservation_set.filter(end__gte=now)
            .exclude(state__in=[ReservationState.CANCELLED, ReservationState.DENIED])
            .exists()
        )

        has_open_applications = user.application_set.exclude(
            cached_latest_status__in=[
                ApplicationStatus.DRAFT,
                ApplicationStatus.EXPIRED,
                ApplicationStatus.CANCELLED,
            ]
        ).exists()  # As in MVP we don't know what's the real status of the application when e.g. SENT or HANDLED.

        has_open_payments = user.reservation_set.filter(
            payment_order__isnull=False,
            payment_order__remote_id__isnull=False,
            payment_order__status=OrderStatus.DRAFT,
        ).exists()

        return not (has_open_reservations or has_open_applications or has_open_payments)

    def delete(self, request, *args, **kwargs):
        dry_run_serializer = DryRunSerializer(data=request.data)
        dry_run_serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            try:
                self._delete()
            except AnonymizationNotAllowedError:
                return Response(status=status.HTTP_403_FORBIDDEN)
            if dry_run_serializer.data["dry_run"]:
                transaction.set_rollback(True)
        return Response(status=status.HTTP_204_NO_CONTENT)
