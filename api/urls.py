from rest_framework import routers

from .application_round_api import ApplicationRoundViewSet
from .applications_api.views import ApplicationEventViewSet, ApplicationViewSet
from .permissions_api import (
    GeneralRoleViewSet,
    ServiceSectorRoleViewSet,
    UnitRoleViewSet,
)
from .reservation_units_api import (
    EquipmentCategoryViewSet,
    EquipmentViewSet,
    PurposeViewSet,
    ReservationUnitTypeViewSet,
    ReservationUnitViewSet,
)
from .reservations_api import AbilityGroupViewSet, AgeGroupViewSet, ReservationViewSet
from .resources_api import ResourceViewSet
from .space_api import DistrictViewSet

router = routers.DefaultRouter()

router.register(r"reservation_unit", ReservationUnitViewSet, "reservationunit")
router.register(r"resource", ResourceViewSet, "resource")
router.register(r"reservation", ReservationViewSet, "reservation")
router.register(r"application", ApplicationViewSet, "application")
router.register(r"application_event", ApplicationEventViewSet, "application_event")
router.register(r"application_round", ApplicationRoundViewSet, "application_round")
router.register(r"parameters/district", DistrictViewSet, "district")
router.register(r"unit_role", UnitRoleViewSet, "unit_role")
router.register(r"service_sector_role", ServiceSectorRoleViewSet, "service_sector_role")
router.register(r"general_role", GeneralRoleViewSet, "general_role")
router.register(r"parameters/purpose", PurposeViewSet, "purpose")
router.register(r"parameters/age_group", AgeGroupViewSet, "age_group")
router.register(r"parameters/ability_group", AbilityGroupViewSet, "ability_group")
router.register(
    r"parameters/reservation_unit_type",
    ReservationUnitTypeViewSet,
    "reservation_unit_type",
)
router.register(
    r"parameters/equipment_category",
    EquipmentCategoryViewSet,
    "equipment_category",
)

router.register(
    r"parameters/equipment",
    EquipmentViewSet,
    "equipment",
)
