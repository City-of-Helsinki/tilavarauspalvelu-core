import random
import uuid
from typing import Optional

from auditlog.models import LogEntry

from applications.models import Address, Application, ApplicationEvent, Person
from reservations.models import Reservation, ReservationType
from users.models import ReservationNotification

FIRST_NAMES = [
    "Patrick",
    "Julia",
    "Andrew",
    "Paige",
    "Ewan",
    "Elsie",
    "Toby",
    "Holly",
    "Dominic",
    "Isla",
    "Edison",
    "Luna",
    "Ronald",
    "Bryanna",
    "Augustus",
    "Laurel",
    "Miles",
    "Patricia",
    "Beckett",
    "Elle",
]

LAST_NAMES = [
    "Ward",
    "Robertson",
    "Nicholson",
    "Armstrong",
    "White",
    "Trevino",
    "James",
    "Hines",
    "Clark",
    "Castro",
    "Read",
    "Brown",
    "Griffiths",
    "Taylor",
    "Cole",
    "Leach",
    "Chavez",
    "Stout",
    "Mccullough",
    "Richards",
]


def get_first_name():
    # Random library isn't safe for security / cryptography thus the nosec line to skip the bandit check.
    # We anonymize data and clean traces so getting random string from a list is not back traceable.
    return random.choice(FIRST_NAMES)  # nosec


def get_last_name():
    # Random library isn't safe for security / cryptography thus the nosec line to skip the bandit check.
    # We anonymize data and clean traces so getting random string from a list is not back traceable.
    return random.choice(LAST_NAMES)  # nosec


def anonymize_string(s: Optional[str], replacement: str = "Anonymized"):
    return replacement if s and s.strip() else s


def anonymize_user(user):
    user.first_name = get_first_name()
    user.last_name = get_last_name()
    user.email = f"{user.first_name}.{user.last_name}@anonymized.net"
    user.uuid = uuid.uuid4()
    user.username = f"anonymized-{user.uuid}"
    user.date_of_birth = None
    user.reservation_notification = ReservationNotification.NONE
    user.is_active = False
    user.is_superuser = False
    user.is_staff = False
    user.save()


def anonymize_user_reservations(user):
    long_text_replacement = (
        "Sensitive data of this reservation has been anonymized by a script"
    )
    reservations = Reservation.objects.filter(user=user).exclude(
        type__in=[ReservationType.BLOCKED, ReservationType.STAFF]
    )
    for reservation in reservations:
        Reservation.objects.filter(pk=reservation.pk).update(
            name=anonymize_string(reservation.name),
            description=anonymize_string(reservation.description),
            reservee_first_name=user.first_name,
            reservee_last_name=user.last_name,
            reservee_email=user.email,
            reservee_phone="",
            reservee_address_zip=anonymize_string(
                reservation.reservee_address_zip, "999999"
            ),
            reservee_address_city=anonymize_string(reservation.reservee_address_city),
            reservee_address_street=anonymize_string(
                reservation.reservee_address_street
            ),
            billing_first_name=user.first_name,
            billing_last_name=user.last_name,
            billing_email=user.email,
            billing_phone="",
            billing_address_zip=anonymize_string(
                reservation.billing_address_zip, "99999"
            ),
            billing_address_city=anonymize_string(reservation.billing_address_city),
            billing_address_street=anonymize_string(reservation.billing_address_street),
            working_memo="",
            free_of_charge_reason=anonymize_string(
                reservation.free_of_charge_reason, long_text_replacement
            ),
            cancel_details=anonymize_string(
                reservation.cancel_details, long_text_replacement
            ),
            handling_details=anonymize_string(
                reservation.handling_details, long_text_replacement
            ),
        )
    audit_log_ids = LogEntry.objects.get_for_objects(reservations).values_list(
        "id", flat=True
    )
    LogEntry.objects.filter(id__in=audit_log_ids).delete()


def anonymize_user_applications(user):
    ApplicationEvent.objects.filter(application__user=user).update(
        name="Sensitive data of this application has been anonymized by a script",
        name_fi="Sensitive data of this application has been anonymized by a script",
        name_en="Sensitive data of this application has been anonymized by a script",
        name_sv="Sensitive data of this application has been anonymized by a script",
    )
    Person.objects.filter(application__user=user).update(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        phone_number="",
    )
    Address.objects.filter(application__user=user).update(
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


def anonymize_user_data(user):
    anonymize_user(user)
    anonymize_user_applications(user)
    anonymize_user_reservations(user)
