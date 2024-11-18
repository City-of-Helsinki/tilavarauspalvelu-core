import django.apps
import pytest
from django.db import models

from tests.helpers import with_mock_verkkokauppa
from tilavarauspalvelu.management.commands.create_test_data import create_test_data
from tilavarauspalvelu.models import (
    AbilityGroup,
    Building,
    Introduction,
    Keyword,
    KeywordCategory,
    KeywordGroup,
    PaymentOrder,
    PersonalInfoViewLog,
    RealEstate,
    RecurringReservation,
    RejectedOccurrence,
    ReservationStatistic,
    ReservationStatisticsReservationUnit,
    ReservationUnitImage,
    ServiceSector,
)
from tilavarauspalvelu.models.request_log.model import RequestLog
from tilavarauspalvelu.models.sql_log.model import SQLLog

models_that_should_be_empty: list[type[models.Model]] = [
    AbilityGroup,
    Building,
    Introduction,
    Keyword,
    KeywordCategory,
    KeywordGroup,
    PaymentOrder,
    PersonalInfoViewLog,
    RealEstate,
    RecurringReservation,
    RejectedOccurrence,
    RequestLog,
    ReservationStatistic,
    ReservationStatisticsReservationUnit,
    ReservationUnitImage,
    SQLLog,
    ServiceSector,
]


@pytest.mark.django_db
@pytest.mark.slow
@with_mock_verkkokauppa
def test_create_test_data(settings):
    settings.UPDATE_RESERVATION_UNIT_THUMBNAILS = True

    all_models = django.apps.apps.app_configs["tilavarauspalvelu"].get_models()

    for model in all_models:
        assert not model.objects.exists(), f"Model {model.__name__} is not empty"

    create_test_data(flush=False)

    for model in all_models:
        if model in models_that_should_be_empty:
            continue
        assert model.objects.exists(), f"Model {model.__name__} is empty"
