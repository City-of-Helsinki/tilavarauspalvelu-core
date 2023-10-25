import uuid

from auditlog.models import LogEntry
from dateutil.relativedelta import relativedelta
from django.utils import timezone

from applications.choices import ApplicationStatusChoice
from applications.models import Address, Application, ApplicationEvent, Person
from merchants.models import OrderStatus
from permissions.models import GeneralRole, ServiceSectorRole, UnitRole
from reservations.choices import ReservationStateChoice, ReservationTypeChoice
from reservations.models import Reservation
from users.models import ReservationNotification, User


def anonymize_string(s: str | None, replacement: str = "Anonymized") -> str:
    return replacement if s and s.strip() else s


def anonymize_user(user: User) -> None:
    user.first_name = "ANON"
    user.last_name = "ANONYMIZED"
    user.email = f"{user.first_name}.{user.last_name}@anonymized.net"
    user.uuid = uuid.uuid4()
    user.username = f"anonymized-{user.uuid}"
    user.date_of_birth = None
    user.reservation_notification = ReservationNotification.NONE
    user.is_active = False
    user.is_superuser = False
    user.is_staff = False
    user.save()

    GeneralRole.objects.filter(user=user).delete()
    ServiceSectorRole.objects.filter(user=user).delete()
    UnitRole.objects.filter(user=user).delete()


def anonymize_user_reservations(user: User) -> None:
    long_text_replacement = "Sensitive data of this reservation has been anonymized by a script"
    reservations = Reservation.objects.filter(user=user).exclude(
        type__in=[ReservationTypeChoice.BLOCKED, ReservationTypeChoice.STAFF]
    )
    for reservation in reservations:
        Reservation.objects.filter(pk=reservation.pk).update(
            name=anonymize_string(reservation.name),
            description=anonymize_string(reservation.description),
            reservee_first_name=user.first_name,
            reservee_last_name=user.last_name,
            reservee_email=user.email,
            reservee_phone="",
            reservee_address_zip=anonymize_string(reservation.reservee_address_zip, "999999"),
            reservee_address_city=anonymize_string(reservation.reservee_address_city),
            reservee_address_street=anonymize_string(reservation.reservee_address_street),
            billing_first_name=user.first_name,
            billing_last_name=user.last_name,
            billing_email=user.email,
            billing_phone="",
            billing_address_zip=anonymize_string(reservation.billing_address_zip, "99999"),
            billing_address_city=anonymize_string(reservation.billing_address_city),
            billing_address_street=anonymize_string(reservation.billing_address_street),
            working_memo="",
            free_of_charge_reason=anonymize_string(reservation.free_of_charge_reason, long_text_replacement),
            cancel_details=anonymize_string(reservation.cancel_details, long_text_replacement),
            handling_details=anonymize_string(reservation.handling_details, long_text_replacement),
        )
    audit_log_ids = LogEntry.objects.get_for_objects(reservations).values_list("id", flat=True)
    LogEntry.objects.filter(id__in=audit_log_ids).delete()


def anonymize_user_applications(user: User) -> None:
    ApplicationEvent.objects.filter(application__user=user).update(
        name="Sensitive data of this application has been anonymized by a script",
        name_fi="Sensitive data of this application has been anonymized by a script",
        name_en="Sensitive data of this application has been anonymized by a script",
        name_sv="Sensitive data of this application has been anonymized by a script",
    )
    Person.objects.filter(applications__user=user).update(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        phone_number="",
    )
    Address.objects.filter(applications__user=user).update(
        post_code="99999",
        city="Anonymized",
        city_fi="Anonymized",
        city_en="Anonymized",
        city_sv="Anonymized",
        street_address="Anonymized",
        street_address_fi="Anonymized",
        street_address_en="Anonymized",
        street_address_sv="Anonymized",
    )
    Application.objects.filter(user=user).update(
        additional_information="Sensitive data of this application has been anonymized by a script"
    )


def anonymize_user_data(user: User):
    anonymize_user(user)
    anonymize_user_applications(user)
    anonymize_user_reservations(user)


def can_user_be_anonymized(user: User) -> bool:
    month_ago = timezone.now() - relativedelta(months=1)

    has_open_reservations = (
        user.reservation_set.filter(end__gte=month_ago)
        .exclude(
            state__in=[
                ReservationStateChoice.CANCELLED.value,
                ReservationStateChoice.DENIED.value,
            ]
        )
        .exists()
    )

    has_open_applications = (
        user.applications.all()
        .has_status_in(
            [
                ApplicationStatusChoice.RECEIVED.value,
                ApplicationStatusChoice.IN_ALLOCATION.value,
            ]
        )
        .exists()
    )

    has_open_payments = user.reservation_set.filter(
        payment_order__isnull=False,
        payment_order__remote_id__isnull=False,
        payment_order__status=OrderStatus.DRAFT,
    ).exists()

    return not (has_open_reservations or has_open_applications or has_open_payments)