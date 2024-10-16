import pytest

from tests.factories import ApplicationFactory, ReservationFactory
from tilavarauspalvelu.enums import Language
from tilavarauspalvelu.integrations.email.find_language import (
    get_application_email_language,
    get_reservation_email_language,
)

pytestmark = [
    pytest.mark.django_db,
]


@pytest.mark.parametrize("preferred_language", Language.values)
def test_get_application_email_language(preferred_language):
    application = ApplicationFactory.create(user__preferred_language=preferred_language)

    lang = get_application_email_language(application)

    assert lang == preferred_language


@pytest.mark.parametrize("preferred_language", Language.values)
def test_get_reservation_email_language(preferred_language):
    reservation = ReservationFactory.create(user__preferred_language=preferred_language)

    lang = get_reservation_email_language(reservation)

    assert lang == preferred_language
