import pytest
from django.db.models import Model

from applications.models import (
    Address,
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationRound,
    EventReservationUnit,
    Organisation,
    Person,
)
from common.management.commands.create_test_data import create_test_data
from permissions.models import (
    GeneralRole,
    GeneralRoleChoice,
    GeneralRolePermission,
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRole,
    UnitRoleChoice,
    UnitRolePermission,
)
from reservation_units.models import (
    Equipment,
    EquipmentCategory,
    Purpose,
    Qualifier,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitPaymentType,
    ReservationUnitPricing,
    ReservationUnitType,
    TaxPercentage,
)
from reservations.models import (
    AgeGroup,
    Reservation,
    ReservationCancelReason,
    ReservationDenyReason,
    ReservationMetadataField,
    ReservationMetadataSet,
    ReservationPurpose,
)
from resources.models import Resource
from services.models import Service
from spaces.models import Location, ServiceSector, Space, Unit, UnitGroup
from terms_of_use.models import TermsOfUse
from users.models import User

models: list[type[Model]] = [
    Address,
    AgeGroup,
    Application,
    ApplicationEvent,
    ApplicationEventSchedule,
    ApplicationRound,
    Equipment,
    EquipmentCategory,
    EventReservationUnit,
    GeneralRole,
    GeneralRoleChoice,
    GeneralRolePermission,
    Location,
    Organisation,
    Person,
    Purpose,
    Qualifier,
    Reservation,
    ReservationCancelReason,
    ReservationDenyReason,
    ReservationMetadataField,
    ReservationMetadataSet,
    ReservationPurpose,
    ReservationUnit,
    ReservationUnitCancellationRule,
    ReservationUnitPaymentType,
    ReservationUnitPricing,
    ReservationUnitType,
    Resource,
    Service,
    ServiceSector,
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    Space,
    TaxPercentage,
    TermsOfUse,
    Unit,
    UnitGroup,
    UnitRole,
    UnitRoleChoice,
    UnitRolePermission,
    User,
]


@pytest.mark.django_db
def test_create_test_data():
    for model in models:
        if model in (
            GeneralRoleChoice,
            GeneralRolePermission,
            ReservationMetadataField,
            ReservationUnitPaymentType,
            ServiceSectorRoleChoice,
            ServiceSectorRolePermission,
            TaxPercentage,
            UnitRoleChoice,
            UnitRolePermission,
        ):
            continue
        assert model.objects.count() == 0, f"Model {model.__name__} is not empty"

    create_test_data(flush=False)

    for model in models:
        assert model.objects.count() != 0, f"Model {model.__name__} is empty"
