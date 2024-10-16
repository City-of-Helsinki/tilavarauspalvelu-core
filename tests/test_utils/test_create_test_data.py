import django.apps
import pytest
from django.db import models

from tilavarauspalvelu.management.commands.create_test_data import create_test_data
from tilavarauspalvelu.models import (
    AbilityGroup,
    AffectingTimeSpan,
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
    ReservationMetadataField,
    ReservationStatistic,
    ReservationStatisticsReservationUnit,
    ReservationUnitHierarchy,
    ReservationUnitImage,
    ReservationUnitPaymentType,
    TaxPercentage,
)
from tilavarauspalvelu.models.request_log.model import RequestLog
from tilavarauspalvelu.models.sql_log.model import SQLLog

apps_to_check: list[str] = [
    "common",
    "users",
    "applications",
    "email_notification",
    "merchants",
    "opening_hours",
    "permissions",
    "reservation_units",
    "reservations",
    "resources",
    "services",
    "spaces",
    "terms_of_use",
    "api",
]

models_that_always_contain_data: list[type[models.Model]] = [
    ReservationMetadataField,
    ReservationUnitPaymentType,
    TaxPercentage,
]

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
]


@pytest.mark.django_db
@pytest.mark.slow
def test_create_test_data():
    all_models = []
    for app_config in django.apps.apps.app_configs.values():
        if app_config.name in apps_to_check:
            all_models.extend(app_config.get_models())

    for model in all_models:
        if model in models_that_always_contain_data:
            continue
        assert not model.objects.exists(), f"Model {model.__name__} is not empty"

    create_test_data(flush=False)

    # Call refresh at the end, since signals for it are disabled.
    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    for model in all_models:
        if model in models_that_should_be_empty:
            continue
        assert model.objects.exists(), f"Model {model.__name__} is empty"
