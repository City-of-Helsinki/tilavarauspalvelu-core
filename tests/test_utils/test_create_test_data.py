import django.apps
import pytest
from django.db import models

from applications.models import ApplicationEvent, ApplicationEventSchedule, EventReservationUnit
from common.management.commands.create_test_data import create_test_data
from email_notification.models import EmailTemplate
from merchants.models import PaymentOrder
from permissions.models import (
    GeneralRoleChoice,
    GeneralRolePermission,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRoleChoice,
    UnitRolePermission,
)
from reservation_units.models import (
    Introduction,
    Keyword,
    KeywordCategory,
    KeywordGroup,
    ReservationUnitImage,
    ReservationUnitPaymentType,
    TaxPercentage,
)
from reservations.models import AbilityGroup, RecurringReservation, ReservationMetadataField
from spaces.models import Building, RealEstate
from users.models import PersonalInfoViewLog, ProxyUserSocialAuth

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
    GeneralRoleChoice,
    GeneralRolePermission,
    ReservationMetadataField,
    ReservationUnitPaymentType,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    TaxPercentage,
    UnitRoleChoice,
    UnitRolePermission,
]

models_that_should_be_empty: list[type[models.Model]] = [
    AbilityGroup,
    ApplicationEvent,
    ApplicationEventSchedule,
    Building,
    EmailTemplate,
    EventReservationUnit,
    Introduction,
    Keyword,
    KeywordCategory,
    KeywordGroup,
    PaymentOrder,
    PersonalInfoViewLog,
    ProxyUserSocialAuth,
    RealEstate,
    RecurringReservation,
    ReservationUnitImage,
]


@pytest.mark.django_db()
@pytest.mark.slow()
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

    for model in all_models:
        if model in models_that_should_be_empty:
            continue
        assert model.objects.exists(), f"Model {model.__name__} is empty"
