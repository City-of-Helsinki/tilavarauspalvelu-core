import uuid
from functools import cached_property
from typing import Any, Self

from django.conf import settings
from django.db import models
from django.utils.timezone import get_default_timezone
from django.utils.translation import gettext_lazy as _
from helsinki_gdpr.models import SerializableMixin
from helusers.models import AbstractUser

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationNotification(models.TextChoices):
    ALL = "all"
    ONLY_HANDLING_REQUIRED = "only_handling_required"
    NONE = "none"


class User(AbstractUser):
    tvp_uuid = models.UUIDField(default=uuid.uuid4, null=False, editable=False, unique=True)
    preferred_language = models.CharField(
        max_length=8,
        null=True,
        blank=True,
        verbose_name=_("Preferred UI language"),
        choices=settings.LANGUAGES,
    )

    reservation_notification = models.CharField(
        max_length=32,
        verbose_name=_("Reservation notification"),
        choices=ReservationNotification.choices,
        blank=False,
        null=False,
        default=ReservationNotification.ONLY_HANDLING_REQUIRED,
        help_text="When user wants to receive reservation notification emails.",
    )

    date_of_birth = models.DateField(verbose_name=_("Date of birth"), null=True)

    profile_id = models.CharField(max_length=255, null=False, blank=True, default="")

    def __str__(self):
        default = super().__str__()

        if self.last_login:
            return f"{default} - {self.last_login.astimezone(DEFAULT_TIMEZONE).strftime('%d.%m.%Y %H:%M')}"

        return default

    def get_display_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    def get_preferred_language(self):
        if not self.preferred_language:
            return settings.LANGUAGES[0][0]
        else:
            return self.preferred_language

    @cached_property
    def has_staff_permissions(self) -> bool:
        return (
            self.is_superuser
            or self.general_roles.exists()
            or self.service_sector_roles.exists()
            or self.unit_roles.exists()
        )


class PersonalInfoViewLog(models.Model):
    field = models.CharField(max_length=255, null=False, blank=False, editable=False)
    user = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL,
        related_name="personal_info_view_logs",
        editable=False,
    )
    viewer_username = models.CharField(max_length=255)
    viewer_user = models.ForeignKey(
        User,
        null=True,
        on_delete=models.SET_NULL,
        related_name="as_viewer_personal_info_view_logs",
        editable=False,
    )
    access_time = models.DateTimeField(auto_now=True, editable=False)
    viewer_user_email = models.CharField(max_length=255, default="", blank=True)
    viewer_user_full_name = models.CharField(max_length=255, default="", blank=True)

    def __str__(self) -> str:
        return f"{self.viewer_username} viewed {self.user}'s {self.field} at {self.access_time}"


class ProfileUser(SerializableMixin, User):
    serialize_fields = (
        {"name": "user", "accessor": lambda user: user.get_full_name()},
        {"name": "email"},
        {"name": "date_of_birth"},
        {"name": "user_reservations"},
        {"name": "user_applications"},
    )

    class Meta:
        proxy = True

    @property
    def user(self) -> Self:
        """Needed for `helsinki_gdpr.views.GDPRScopesPermission.has_object_permission`"""
        return self

    @property
    def user_reservations(self) -> list[list[Any]]:
        return [
            [
                reservation.name,
                reservation.description,
                reservation.begin,
                reservation.end,
                reservation.reservee_first_name,
                reservation.reservee_last_name,
                reservation.reservee_email,
                reservation.reservee_phone,
                reservation.reservee_address_zip,
                reservation.reservee_address_city,
                reservation.reservee_address_street,
                reservation.billing_first_name,
                reservation.billing_last_name,
                reservation.billing_email,
                reservation.billing_phone,
                reservation.billing_address_zip,
                reservation.billing_address_city,
                reservation.billing_address_street,
                reservation.reservee_id,
                reservation.reservee_organisation_name,
                reservation.free_of_charge_reason,
                reservation.cancel_details,
            ]
            for reservation in self.reservation_set.all()
        ]

    @property
    def user_applications(self) -> list[list[Any]]:
        applications = []

        for application in self.applications.all():
            application_data = [application.additional_information]

            events = []
            for e in application.application_events.all():
                events.append(e.name)
                events.append(e.name_fi)
                events.append(e.name_en)
                events.append(e.name_sv)

            application_data.append({"events": events})

            if application.contact_person:
                application_data.append(
                    {
                        "contact_person": [
                            application.contact_person.first_name,
                            application.contact_person.last_name,
                            application.contact_person.email,
                            application.contact_person.phone_number,
                        ]
                    }
                )

            if application.organisation:
                application_data.append(
                    {
                        "organisation": [
                            application.organisation.name,
                            application.organisation.identifier,
                            application.organisation.email,
                            application.organisation.core_business,
                            application.organisation.core_business_fi,
                            application.organisation.core_business_en,
                            application.organisation.core_business_sv,
                        ]
                    }
                )

            if application.organisation and application.organisation.address:
                application_data.append(
                    {
                        "organisation_address": [
                            application.organisation.address.post_code,
                            application.organisation.address.street_address,
                            application.organisation.address.street_address_fi,
                            application.organisation.address.street_address_en,
                            application.organisation.address.street_address_sv,
                            application.organisation.address.city,
                            application.organisation.address.city_fi,
                            application.organisation.address.city_en,
                            application.organisation.address.city_sv,
                        ]
                    }
                )

            if application.billing_address:
                application_data.append(
                    {
                        "billing_address": [
                            application.billing_address.post_code,
                            application.billing_address.street_address,
                            application.billing_address.street_address_fi,
                            application.billing_address.street_address_en,
                            application.billing_address.street_address_sv,
                            application.billing_address.city,
                            application.billing_address.city_fi,
                            application.billing_address.city_en,
                            application.billing_address.city_sv,
                        ]
                    }
                )
            applications.append(application_data)

        return applications
