from __future__ import annotations

from contextlib import contextmanager
from http import HTTPStatus
from typing import TYPE_CHECKING
from unittest.mock import patch

import pytest
from django.core.cache import cache
from django.urls import reverse
from freezegun import freeze_time

from tilavarauspalvelu.management.commands.data_creation.create_robot_test_data import remove_existing_data
from tilavarauspalvelu.models import (
    Application,
    ApplicationRound,
    Equipment,
    EquipmentCategory,
    GeneralRole,
    IntendedUse,
    OriginHaukiResource,
    PaymentAccounting,
    PaymentProduct,
    Reservation,
    ReservationSeries,
    ReservationUnit,
    ReservationUnitAccessType,
    ReservationUnitCancellationRule,
    ReservationUnitPricing,
    Space,
    TaxPercentage,
    TermsOfUse,
    Unit,
    UnitGroup,
    UnitRole,
    User,
)
from tilavarauspalvelu.tasks import create_robot_test_data_task
from utils.date_utils import local_datetime

from tests.factories import (
    ApplicationFactory,
    ApplicationRoundFactory,
    ReservationFactory,
    ReservationUnitFactory,
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
    create_robot_test_data_task.delay()

    assert Unit.objects.count() == 1
    assert UnitGroup.objects.count() == 1
    assert ReservationUnit.objects.count() == 23
    assert Space.objects.count() == 23
    assert ReservationUnitPricing.objects.count() == 23
    assert ReservationUnitAccessType.objects.count() == 23
    assert User.objects.count() == 39
    assert ApplicationRound.objects.count() == 1
    assert Reservation.objects.count() == 2
    assert UnitRole.objects.count() == 2
    assert GeneralRole.objects.count() == 1


@pytest.mark.slow
@pytest.mark.django_db
def test_create_robot_test_data__remove_existing_data_between_runs():
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

    create_robot_test_data_task.delay()

    assert Unit.objects.count() == 1 + 1  # +1 unit for 'other_reservation'
    assert ReservationUnit.objects.count() == 23 + 1  # +1 reservation unit for 'other_reservation'
    assert Space.objects.count() == 23
    assert ReservationUnitPricing.objects.count() == 23
    assert ReservationUnitAccessType.objects.count() == 23
    assert User.objects.count() == 39 + 1  # +1 user for other entities
    assert ApplicationRound.objects.count() == 1 + 1  # +1 application round for 'other_application'
    assert Reservation.objects.count() == 2 + 1  # +1 reservation for 'other_reservation'

    # Reservations in other units are not deleted
    assert Reservation.objects.filter(pk=other_reservation.pk).exists()

    # Reservations in other application rounds are not deleted
    assert Application.objects.filter(pk=other_application.pk).exists()


@pytest.mark.slow
@pytest.mark.django_db
def test_create_robot_test_data__users_can_exist_before_run():
    UserFactory.create(username="u-5ubvcxgrxzdf5nj7y4sbjnvyeq")

    create_robot_test_data_task.delay()

    assert User.objects.count() == 39


@pytest.mark.slow
@pytest.mark.django_db
def test_remove_existing_data():
    create_robot_test_data_task.delay()
    remove_existing_data()

    assert Unit.objects.count() == 0
    assert ReservationUnit.objects.count() == 0
    assert Space.objects.count() == 0
    assert ReservationUnitPricing.objects.count() == 0
    assert ReservationUnitAccessType.objects.count() == 0
    assert ApplicationRound.objects.count() == 0
    assert Reservation.objects.count() == 0
    assert ReservationSeries.objects.count() == 0
    assert GeneralRole.objects.count() == 0
    assert UnitRole.objects.count() == 0

    # Not everything is removed
    assert ReservationUnitCancellationRule.objects.count() == 2
    assert TermsOfUse.objects.count() == 14
    assert IntendedUse.objects.count() == 8
    assert EquipmentCategory.objects.count() == 6
    assert Equipment.objects.count() == 29
    assert TaxPercentage.objects.count() == 2
    assert OriginHaukiResource.objects.count() == 14
    assert PaymentProduct.objects.count() == 5
    assert PaymentAccounting.objects.count() == 1
    assert User.objects.count() == 39  # Users are not removed


# Helpers


@contextmanager
def mock_data_generation() -> Generator[NonCallableMock]:
    path = "tilavarauspalvelu.api.rest.views.create_robot_test_data_task.delay"
    with patch(path) as mock:
        yield mock
