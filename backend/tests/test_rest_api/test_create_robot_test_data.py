from __future__ import annotations

from contextlib import contextmanager
from decimal import Decimal
from http import HTTPStatus
from typing import TYPE_CHECKING
from unittest.mock import patch

import pytest
from django.core.cache import cache
from django.core.exceptions import ValidationError
from django.urls import reverse
from freezegun import freeze_time

from tilavarauspalvelu.management.commands.create_robot_test_data import create_robot_test_data, remove_existing_data
from tilavarauspalvelu.models import (
    Application,
    ApplicationRound,
    OriginHaukiResource,
    Reservation,
    ReservationSeries,
    ReservationUnit,
    ReservationUnitAccessType,
    ReservationUnitPricing,
    Space,
    Unit,
    User,
)
from utils.date_utils import local_datetime

from tests.factories import (
    ApplicationFactory,
    ApplicationRoundFactory,
    EquipmentFactory,
    PaymentAccountingFactory,
    PurposeFactory,
    ReservationFactory,
    ReservationMetadataSetFactory,
    ReservationPurposeFactory,
    ReservationSeriesFactory,
    ReservationUnitCancellationRuleFactory,
    ReservationUnitFactory,
    ReservationUnitTypeFactory,
    TaxPercentageFactory,
    TermsOfUseFactory,
    UnitFactory,
    UserFactory,
)

if TYPE_CHECKING:
    from collections.abc import Generator
    from unittest.mock import NonCallableMock


@pytest.fixture
def clear_robot_test_data_flags(settings) -> Generator[None]:
    cache.delete(key=settings.ROBOT_TEST_DATA_RATE_LIMIT_KEY)
    cache.delete(key=settings.ROBOT_TEST_DATA_LOCK_KEY)
    try:
        yield
    finally:
        cache.delete(key=settings.ROBOT_TEST_DATA_RATE_LIMIT_KEY)
        cache.delete(key=settings.ROBOT_TEST_DATA_LOCK_KEY)


# View


@pytest.mark.usefixtures("clear_robot_test_data_flags")
def test_robot_test_data_create_view(api_client, settings):
    path = reverse("robot_test_data")

    headers = {
        "Authorization": settings.ROBOT_TEST_DATA_TOKEN,
    }

    with mock_data_generation() as mock:
        response = api_client.post(path, headers=headers)

    assert response.status_code == HTTPStatus.NO_CONTENT, response.content

    assert mock.called is True


@pytest.mark.usefixtures("clear_robot_test_data_flags")
def test_robot_test_data_create_view__missing_token(api_client):
    path = reverse("robot_test_data")

    headers = {}

    with mock_data_generation() as mock:
        response = api_client.post(path, headers=headers)

    assert response.status_code == HTTPStatus.UNAUTHORIZED, response.status_code
    assert response.json() == {
        "detail": "Missing authorization header",
        "code": "permission_denied",
    }

    assert mock.called is False


@pytest.mark.usefixtures("clear_robot_test_data_flags")
def test_robot_test_data_create_view__incorrect_token(api_client):
    path = reverse("robot_test_data")

    headers = {
        "Authorization": "foo",
    }

    with mock_data_generation() as mock:
        response = api_client.post(path, headers=headers)

    assert response.status_code == HTTPStatus.UNAUTHORIZED, response.status_code
    assert response.json() == {
        "detail": "Invalid authorization header",
        "code": "permission_denied",
    }

    assert mock.called is False


@pytest.mark.usefixtures("clear_robot_test_data_flags")
@freeze_time(local_datetime(2025, 1, 1, 12))
def test_robot_test_data_create_view__rate_limit(api_client, settings):
    path = reverse("robot_test_data")

    settings.ROBOT_TEST_DATA_CREATION_RATE_LIMIT_SECONDS = 60

    now = int(local_datetime(2025, 1, 1, 11, 59, 1).timestamp())
    cache.set(key=settings.ROBOT_TEST_DATA_RATE_LIMIT_KEY, value=now, timeout=None)

    headers = {
        "Authorization": settings.ROBOT_TEST_DATA_TOKEN,
    }

    with mock_data_generation() as mock:
        response = api_client.post(path, headers=headers)

    assert response.status_code == HTTPStatus.TOO_MANY_REQUESTS, response.status_code
    assert response.json() == {
        "detail": "Robot test data creation is rate limited",
        "code": "too_many_requests",
    }
    assert response.headers["Retry-After"] == "1"

    assert mock.called is False


@pytest.mark.usefixtures("clear_robot_test_data_flags")
def test_robot_test_data_create_view__lock(api_client, settings):
    path = reverse("robot_test_data")

    cache.set(key=settings.ROBOT_TEST_DATA_LOCK_KEY, value=True, timeout=None)

    headers = {
        "Authorization": settings.ROBOT_TEST_DATA_TOKEN,
    }

    with mock_data_generation() as mock:
        response = api_client.post(path, headers=headers)

    assert response.status_code == HTTPStatus.TOO_EARLY, response.status_code
    assert response.json() == {
        "detail": "Robot test data creation is already in progress",
        "code": "too_early",
    }

    assert mock.called is False


# Command


@pytest.mark.slow
@pytest.mark.django_db
def test_create_robot_test_data():
    _create_required_data()

    create_robot_test_data()

    assert Unit.objects.count() == 1
    assert ReservationUnit.objects.count() == 20
    assert Space.objects.count() == 20
    assert ReservationUnitPricing.objects.count() == 20
    assert ReservationUnitAccessType.objects.count() == 20
    assert User.objects.count() == 29
    assert ApplicationRound.objects.count() == 1
    assert Reservation.objects.count() == 1


@pytest.mark.slow
@pytest.mark.django_db
def test_create_robot_test_data__fails_due_to_missing_data():
    with pytest.raises(ValidationError):
        create_robot_test_data()


@pytest.mark.slow
@pytest.mark.django_db
def test_create_robot_test_data__remove_existing_data_between_runs():
    _create_required_data()

    # Unit is recreated
    harakka = UnitFactory.create(name="Harakka, piilokoju", tprek_id="71677")

    # Reservation units are recreated
    mankeli = ReservationUnitFactory.create(name="Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA)", unit=harakka)

    # Application round is recreated
    kausi = ApplicationRoundFactory.create(name="Kausivaraus (AUTOMAATIO TESTI ÄLÄ POISTA)")

    # Additional user for existing entities
    user = UserFactory.create()

    # Reservations in given reservation unit are removed, but not in others
    ReservationFactory.create(reservation_unit=mankeli, user=user)
    other_reservation = ReservationFactory.create(user=user)

    # Applications in given application round are removed, but not in others
    ApplicationFactory.create(application_round=kausi, user=user)
    other_application = ApplicationFactory.create(user=user)

    create_robot_test_data()

    assert Unit.objects.count() == 1 + 1  # +1 unit for 'other_reservation'
    assert ReservationUnit.objects.count() == 20 + 1  # +1 reservation unit for 'other_reservation'
    assert Space.objects.count() == 20
    assert ReservationUnitPricing.objects.count() == 20
    assert ReservationUnitAccessType.objects.count() == 20
    assert User.objects.count() == 29 + 1  # +1 user for other entities
    assert ApplicationRound.objects.count() == 1 + 1  # +1 application round for 'other_application'
    assert Reservation.objects.count() == 1 + 1  # +1 reservation for 'other_reservation'

    # Reservations in other units are not deleted
    assert Reservation.objects.filter(pk=other_reservation.pk).exists()

    # Reservations in other application rounds are not deleted
    assert Application.objects.filter(pk=other_application.pk).exists()


@pytest.mark.slow
@pytest.mark.django_db
def test_create_robot_test_data__users_can_exist_before_run():
    _create_required_data()

    UserFactory.create(username="u-5ubvcxgrxzdf5nj7y4sbjnvyeq")

    create_robot_test_data()

    assert User.objects.count() == 29


@pytest.mark.slow
@pytest.mark.django_db
def test_remove_existing_data():
    harakka = UnitFactory.create(name="Harakka, piilokoju", tprek_id="71677")
    mankeli = ReservationUnitFactory.create(name="Maksuton Mankeli (AUTOMAATIOTESTI ÄLÄ POISTA)", unit=harakka)
    kausi = ApplicationRoundFactory.create(name="Kausivaraus (AUTOMAATIO TESTI ÄLÄ POISTA)")

    ReservationFactory.create(reservation_unit=mankeli)
    ReservationSeriesFactory.create(reservation_unit=mankeli)
    ApplicationFactory.create(application_round=kausi)

    remove_existing_data()

    assert Unit.objects.count() == 0
    assert ReservationUnit.objects.count() == 0
    assert Space.objects.count() == 0
    assert ReservationUnitPricing.objects.count() == 0
    assert ReservationUnitAccessType.objects.count() == 0
    assert ApplicationRound.objects.count() == 0
    assert Reservation.objects.count() == 0
    assert ReservationSeries.objects.count() == 0


# Helpers


@contextmanager
def mock_data_generation() -> Generator[NonCallableMock]:
    path = "tilavarauspalvelu.api.rest.views.create_robot_test_data"
    with patch(path) as mock:
        yield mock


def _create_required_data():
    ReservationUnitTypeFactory.create(name="Kokoustila")

    ReservationMetadataSetFactory.create(name="Lomake 1")
    ReservationMetadataSetFactory.create(name="Lomake 2")
    ReservationMetadataSetFactory.create(name="Lomake 3")
    ReservationMetadataSetFactory.create(name="Lomake 3 - maksuttomuuspyyntö sallittu")
    ReservationMetadataSetFactory.create(name="Lomake 4 - maksuttomuuspyyntö sallittu")

    ReservationUnitCancellationRuleFactory.create(name="Varauksen alkuun asti")
    ReservationUnitCancellationRuleFactory.create(name="14 vrk ennen alkamista")

    TermsOfUseFactory.create(id="pay0")
    TermsOfUseFactory.create(id="pay1")
    TermsOfUseFactory.create(id="pay3")
    TermsOfUseFactory.create(id="pay4")
    TermsOfUseFactory.create(id="cancel0days")
    TermsOfUseFactory.create(id="cancel0days_delayok")
    TermsOfUseFactory.create(id="cancel2weeks")
    TermsOfUseFactory.create(id="KUVAlaite")
    TermsOfUseFactory.create(id="KUVA_oodi")
    TermsOfUseFactory.create(id="KUVA_nupa")
    TermsOfUseFactory.create(id="KUVA_oodi_maksuton")
    TermsOfUseFactory.create(id="KUVA_nupakausi")
    TermsOfUseFactory.create(id="pricing_nupa")
    TermsOfUseFactory.create(id="KUVAnupa")

    PurposeFactory.create(name="Harrasta yhdessä")
    PurposeFactory.create(name="Järjestä tapahtuma")
    PurposeFactory.create(name="Käytä laitteita")
    PurposeFactory.create(name="Liiku ja rentoudu")
    PurposeFactory.create(name="Löydä juhlatila")
    PurposeFactory.create(name="Pidä kokous")
    PurposeFactory.create(name="Tee musiikkia tai äänitä")
    PurposeFactory.create(name="Työskentele yksin tai ryhmässä")

    ReservationPurposeFactory.create(name="Harrastustoiminta, muu")

    EquipmentFactory.create(name="Äänitekniikka")
    EquipmentFactory.create(name="Astianpesukone")
    EquipmentFactory.create(name="Perusastiasto ja -keittiövälineet")
    EquipmentFactory.create(name="Biljardipöytä")
    EquipmentFactory.create(name="ClickShare")
    EquipmentFactory.create(name="Esiintymislava")
    EquipmentFactory.create(name="HDMI")
    EquipmentFactory.create(name="Muu internet-yhteys")
    EquipmentFactory.create(name="Istumapaikkoja")
    EquipmentFactory.create(name="Jääkaappi")
    EquipmentFactory.create(name="Jatkojohto")
    EquipmentFactory.create(name="Kahvinkeitin")
    EquipmentFactory.create(name="Liesi")
    EquipmentFactory.create(name="Liikuntavälineitä")
    EquipmentFactory.create(name="Mikroaaltouuni")
    EquipmentFactory.create(name="Näyttö")
    EquipmentFactory.create(name="Pakastin")
    EquipmentFactory.create(name="Peiliseinä")
    EquipmentFactory.create(name="Piano")
    EquipmentFactory.create(name="Pöytä tai pöytiä")
    EquipmentFactory.create(name="Sähkörummut")
    EquipmentFactory.create(name="SCART")
    EquipmentFactory.create(name="Sohvaryhmä")
    EquipmentFactory.create(name="Studiolaitteisto")
    EquipmentFactory.create(name="Tietokone")
    EquipmentFactory.create(name="Uuni")
    EquipmentFactory.create(name="Valkotaulu, tussitaulu")
    EquipmentFactory.create(name="Vedenkeitin")
    EquipmentFactory.create(name="Vesipiste")

    TaxPercentageFactory.create(value=Decimal("0.0"))
    TaxPercentageFactory.create(value=Decimal("25.5"))

    OriginHaukiResource.objects.create(id="2956668")
    OriginHaukiResource.objects.create(id="2958620")
    OriginHaukiResource.objects.create(id="2956344")
    OriginHaukiResource.objects.create(id="2959295")
    OriginHaukiResource.objects.create(id="2959623")
    OriginHaukiResource.objects.create(id="2964786")
    OriginHaukiResource.objects.create(id="2964787")
    OriginHaukiResource.objects.create(id="2959579")
    OriginHaukiResource.objects.create(id="2959580")
    OriginHaukiResource.objects.create(id="2959581")

    PaymentAccountingFactory.create(name="Pihlajasaarten testikirjasto")
