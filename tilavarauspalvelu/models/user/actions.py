from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from auditlog.models import LogEntry
from dateutil.relativedelta import relativedelta
from django.utils import timezone
from social_django.models import UserSocialAuth

from tilavarauspalvelu.enums import (
    ApplicationStatusChoice,
    OrderStatus,
    ReservationNotification,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from tilavarauspalvelu.models import (
    Address,
    Application,
    ApplicationSection,
    GeneralRole,
    Person,
    RecurringReservation,
    Reservation,
    UnitRole,
)
from tilavarauspalvelu.typing import UserAnonymizationInfo

if TYPE_CHECKING:
    from collections.abc import Iterable

    from .model import User


ANONYMIZED_FIRST_NAME = "ANON"
ANONYMIZED_LAST_NAME = "ANONYMIZED"
ANONYMIZED = "Anonymized"
SENSITIVE_RESERVATION = "Sensitive data of this reservation has been anonymized by a script"
SENSITIVE_APPLICATION = "Sensitive data of this application has been anonymized by a script"


class UserActions:
    def __init__(self, user: User) -> None:
        self.user = user

    def anonymize(self) -> None:
        self.anonymize_user()
        self.anonymize_user_applications()
        self.anonymize_user_reservations()

    def anonymize_user(self) -> None:
        self.user.first_name = ANONYMIZED_FIRST_NAME
        self.user.last_name = ANONYMIZED_LAST_NAME
        self.user.email = f"{self.user.first_name}.{self.user.last_name}@anonymized.net"
        self.user.uuid = uuid.uuid4()
        self.user.username = f"anonymized-{self.user.uuid}"
        self.user.date_of_birth = None
        self.user.reservation_notification = ReservationNotification.NONE
        self.user.is_active = False
        self.user.is_superuser = False
        self.user.is_staff = False
        self.user.profile_id = ""
        self.user.save()

        self.user.ad_groups.clear()

        GeneralRole.objects.filter(user=self.user).delete()
        UnitRole.objects.filter(user=self.user).delete()
        UserSocialAuth.objects.filter(user=self.user).delete()

    def anonymize_user_reservations(self) -> None:
        reservations: Iterable[Reservation] = Reservation.objects.filter(user=self.user).exclude(
            type__in=ReservationTypeChoice.should_not_anonymize,
        )
        recurring_reservations = RecurringReservation.objects.filter(reservations__in=reservations)

        for reservation in reservations:
            reservation.name = ANONYMIZED
            reservation.description = ANONYMIZED
            reservation.reservee_first_name = self.user.first_name
            reservation.reservee_last_name = self.user.last_name
            reservation.reservee_email = self.user.email
            reservation.reservee_phone = ""
            reservation.reservee_address_zip = "99999"
            reservation.reservee_address_city = ANONYMIZED
            reservation.reservee_address_street = ANONYMIZED
            reservation.billing_first_name = self.user.first_name
            reservation.billing_last_name = self.user.last_name
            reservation.billing_email = self.user.email
            reservation.billing_phone = ""
            reservation.billing_address_zip = "99999"
            reservation.billing_address_city = ANONYMIZED
            reservation.billing_address_street = ANONYMIZED
            reservation.working_memo = ""
            reservation.free_of_charge_reason = SENSITIVE_RESERVATION
            reservation.cancel_details = SENSITIVE_RESERVATION
            reservation.handling_details = SENSITIVE_RESERVATION

        for recurring_reservation in recurring_reservations:
            recurring_reservation.name = ANONYMIZED
            recurring_reservation.description = ANONYMIZED

        Reservation.objects.bulk_update(
            reservations,
            [
                "name",
                "description",
                "reservee_first_name",
                "reservee_last_name",
                "reservee_email",
                "reservee_phone",
                "reservee_address_zip",
                "reservee_address_city",
                "reservee_address_street",
                "billing_first_name",
                "billing_last_name",
                "billing_email",
                "billing_phone",
                "billing_address_zip",
                "billing_address_city",
                "billing_address_street",
                "working_memo",
                "free_of_charge_reason",
                "cancel_details",
                "handling_details",
            ],
        )

        RecurringReservation.objects.bulk_update(
            recurring_reservations,
            [
                "name",
                "description",
            ],
        )

        LogEntry.objects.get_for_objects(reservations).delete()

    def anonymize_user_applications(self) -> None:
        ApplicationSection.objects.filter(application__user=self.user).update(
            name=SENSITIVE_APPLICATION,
        )
        Person.objects.filter(applications__user=self.user).update(
            first_name=self.user.first_name,
            last_name=self.user.last_name,
            email=self.user.email,
            phone_number="",
        )
        Address.objects.filter(applications__user=self.user).update(
            post_code="99999",
            city=ANONYMIZED,
            city_fi=ANONYMIZED,
            city_en=ANONYMIZED,
            city_sv=ANONYMIZED,
            street_address=ANONYMIZED,
            street_address_fi=ANONYMIZED,
            street_address_en=ANONYMIZED,
            street_address_sv=ANONYMIZED,
        )
        Application.objects.filter(user=self.user).update(
            additional_information=SENSITIVE_APPLICATION,
            working_memo=SENSITIVE_APPLICATION,
        )

    def can_anonymize(self) -> UserAnonymizationInfo:
        month_ago = timezone.now() - relativedelta(months=1)

        has_open_reservations = (
            self.user.reservations.filter(end__gte=month_ago)
            .exclude(
                state__in=[
                    ReservationStateChoice.CANCELLED.value,
                    ReservationStateChoice.DENIED.value,
                ]
            )
            .exists()
        )

        has_open_applications = (
            self.user.applications.all()
            .has_status_in(
                [
                    ApplicationStatusChoice.RECEIVED.value,
                    ApplicationStatusChoice.IN_ALLOCATION.value,
                ]
            )
            .exists()
        )

        has_open_payments = self.user.reservations.filter(
            payment_order__isnull=False,
            payment_order__remote_id__isnull=False,
            payment_order__status=OrderStatus.DRAFT,
        ).exists()

        return UserAnonymizationInfo(
            has_open_reservations=has_open_reservations,
            has_open_applications=has_open_applications,
            has_open_payments=has_open_payments,
        )
