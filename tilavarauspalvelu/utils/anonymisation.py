import random
import string
import uuid

from auditlog.models import LogEntry

from applications.models import (
    Address,
    Application,
    ApplicationEvent,
    Organisation,
    Person,
)
from reservations.models import Reservation

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


def get_random_text(length=32):
    str = ""
    for i in range(length):
        str += random.choice(string.ascii_letters)
    return str


def get_first_name():
    return random.choice(FIRST_NAMES)


def get_last_name():
    return random.choice(LAST_NAMES)


def anonymize_user(user):
    user.first_name = get_first_name()
    user.last_name = get_last_name()
    user.email = f"{user.first_name}.{user.last_name}@anonymized.net"
    user.uuid = uuid.uuid4()
    user.username = f"anonymized-{user.uuid}"
    user.save()


def anonymize_user_reservations(user):
    reservations = Reservation.objects.filter(user=user)
    reservations.update(
        name="Anonymized",
        description="Anonymized",
        reservee_first_name=user.first_name,
        reservee_last_name=user.last_name,
        reservee_email=user.email,
        reservee_phone="",
        reservee_address_zip="999999",
        reservee_address_city="Anonymized",
        reservee_address_street="Anonymized",
        billing_first_name=user.first_name,
        billing_last_name=user.last_name,
        billing_email=user.email,
        billing_phone="",
        billing_address_zip="99999",
        billing_address_city="Anonymized",
        billing_address_street="Anonymized",
        reservee_id="1234567-2",
        reservee_organisation_name="Anonymized",
        working_memo="",
        free_of_charge_reason="Sensitive data of this reservation has been anonymized by a script",
        cancel_details="Sensitive data of this reservation has been anonymized by a script",
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
    Organisation.objects.filter(application__user=user).update(
        name="Anonymized",
        identifier="1234567-2",
        email=user.email,
        core_business="Anonymized",
        core_business_fi="Anonymized",
        core_business_en="Anonymized",
        core_business_sv="Anonymized",
    )
    Address.objects.filter(organisation__application__user=user).update(
        post_code="99999",
        street_address="Anonymized",
        street_address_fi="Anonymized",
        street_address_en="Anonymized",
        street_address_sv="Anonymized",
        city="Anonymized",
        city_fi="Anonymized",
        city_en="Anonymized",
        city_sv="Anonymized",
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
