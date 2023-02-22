from typing import List

from django.contrib.auth import get_user_model
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from helsinki_gdpr.models import SerializableMixin
from helsinki_gdpr.views import DeletionNotAllowed, DryRunSerializer, GDPRAPIView
from rest_framework import status
from rest_framework.response import Response

from applications.models import ApplicationStatus
from merchants.models import OrderStatus
from reservations.models import STATE_CHOICES as ReservationState
from tilavarauspalvelu.utils.anonymisation import anonymize_user_data

User = get_user_model()


class ProfileUser(SerializableMixin):
    def __init__(self, user: User, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = user

    serialize_fields = (
        {"name": "user", "accessor": lambda u: u.get_full_name()},
        {"name": "email"},
        {"name": "reservations"},
        {"name": "applications"},
    )

    @property
    def reservations(self) -> List[List]:
        reservations = []

        for res in self.user.reservation_set.all():
            reservations.append(
                [
                    res.name,
                    res.description,
                    res.reservee_first_name,
                    res.reservee_last_name,
                    res.reservee_email,
                    res.reservee_phone,
                    res.reservee_address_zip,
                    res.reservee_address_city,
                    res.reservee_address_street,
                    res.billing_first_name,
                    res.billing_last_name,
                    res.billing_email,
                    res.billing_phone,
                    res.billing_address_zip,
                    res.billing_address_city,
                    res.billing_address_street,
                    res.reservee_id,
                    res.reservee_organisation_name,
                    res.free_of_charge_reason,
                    res.cancel_details,
                ]
            )

        return reservations

    @property
    def applications(self) -> List:
        applications = []

        for app in self.user.application_set.all():
            applications.append(app.additional_information)

            events = []
            for e in app.application_events.all():
                events.append(e.name)
                events.append(e.name_fi)
                events.append(e.name_en)
                events.append(e.name_sv)
            applications.append({"events": events})

            if app.contact_person:
                applications.append(
                    {
                        "contact_person": [
                            app.contact_person.first_name,
                            app.contact_person.last_name,
                            app.contact_person.email,
                            app.contact_person.phone_number,
                        ]
                    }
                )

            if app.organisation:
                applications.append(
                    {
                        "organisation": [
                            app.organisation.name,
                            app.organisation.identifier,
                            app.organisation.email,
                            app.organisation.core_business,
                            app.organisation.core_business_fi,
                            app.organisation.core_business_en,
                            app.organisation.core_business_sv,
                        ]
                    }
                )

            if app.organisation and app.organisation.address:
                applications.append(
                    {
                        "organisation_address": [
                            app.organisation.address.post_code,
                            app.organisation.address.street_address,
                            app.organisation.address.street_address_fi,
                            app.organisation.address.street_address_en,
                            app.organisation.address.street_address_sv,
                            app.organisation.address.city,
                            app.organisation.address.city_fi,
                            app.organisation.address.city_en,
                            app.organisation.address.city_sv,
                        ]
                    }
                )

            if app.billing_address:
                applications.append(
                    {
                        "billing_address": [
                            app.billing_address.post_code,
                            app.billing_address.street_address,
                            app.billing_address.street_address_fi,
                            app.billing_address.street_address_en,
                            app.billing_address.street_address_sv,
                            app.billing_address.city,
                            app.billing_address.city_fi,
                            app.billing_address.city_en,
                            app.billing_address.city_sv,
                        ]
                    }
                )

        return applications

    @property
    def email(self):
        return self.user.email


class TilavarauspalveluGDPRAPIView(GDPRAPIView):
    def get_object(self) -> User:
        user = get_object_or_404(User, uuid=self.kwargs["uuid"])
        profile = ProfileUser(user)

        self.check_object_permissions(self.request, profile)
        return profile

    def _delete(self):
        profile_user = self.get_object()
        if not self._check_user_can_be_anonymized(profile_user.user):
            raise DeletionNotAllowed()
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
            self._delete()
            if dry_run_serializer.data["dry_run"]:
                transaction.set_rollback(True)
        return Response(status=status.HTTP_204_NO_CONTENT)
