import pytest

from tilavarauspalvelu.enums import Language
from tilavarauspalvelu.integrations.email.find_language import (
    get_application_email_language,
    get_reservation_email_language,
)

from tests.factories import ApplicationFactory, ReservationFactory

pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("preferred_language", Language.values)
def test_get_application_email_language(preferred_language):
    application = ApplicationFactory.create(user__preferred_language=preferred_language)

    lang = get_application_email_language(application)

    assert lang == preferred_language


def test_get_application_email_language__invalid_preferred_language():
    application = ApplicationFactory.create(user__preferred_language="uk")

    lang = get_application_email_language(application)

    assert lang == Language.FI.value


@pytest.mark.parametrize("preferred_language", Language.values)
def test_get_reservation_email_language(preferred_language):
    reservation = ReservationFactory.create(
        user__preferred_language=preferred_language,
        reservee_language="",
    )

    lang = get_reservation_email_language(reservation)

    assert lang == preferred_language


def test_get_reservation_email_language__use_reservee_language():
    reservation = ReservationFactory.create(
        user__preferred_language="",
        reservee_language=Language.EN.value,
    )

    lang = get_reservation_email_language(reservation)

    assert lang == Language.EN.value


def test_get_reservation_email_language__invalid_languages():
    reservation = ReservationFactory.create(
        user__preferred_language="uk",
        reservee_language="es",
    )

    lang = get_reservation_email_language(reservation)

    assert lang == Language.FI.value
