from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from graphene_file_upload.django import FileUploadGraphQLView
from rest_framework import routers

from .allocation_api import AllocationRequestViewSet
from .allocation_results_api import AllocationResultViewSet
from .application_round_api import ApplicationRoundViewSet
from .applications_api.views import (
    ApplicationEventStatusViewSet,
    ApplicationEventViewSet,
    ApplicationEventWeeklyAmountReductionViewSet,
    ApplicationStatusViewSet,
    ApplicationViewSet,
)
from .city_api import CityViewSet
from .declined_reservation_units_api import DeclinedReservationUnitViewSet
from .gdpr import TilavarauspalveluGDPRAPIView
from .hauki_api import OpeningHoursViewSet
from .ical_api import (
    ApplicationEventIcalViewset,
    ReservationIcalViewset,
    ReservationUnitCalendarUrlViewSet,
    ReservationUnitIcalViewset,
)
from .permissions_api import (
    GeneralRoleViewSet,
    ServiceSectorRoleViewSet,
    UnitRoleViewSet,
)
from .reservation_units_api import (
    EquipmentCategoryViewSet,
    EquipmentViewSet,
    ReservationPurposeViewSet,
    ReservationUnitTypeViewSet,
    ReservationUnitViewSet,
)
from .reservations_api import (
    AbilityGroupViewSet,
    AgeGroupViewSet,
    RecurringReservationViewSet,
    ReservationViewSet,
)
from .resources_api import ResourceViewSet
from .space_api import DistrictViewSet
from .users_api import UserViewSet

router = routers.DefaultRouter()

router.register(r"reservation_unit", ReservationUnitViewSet, "reservationunit")
router.register(r"resource", ResourceViewSet, "resource")
router.register(r"reservation", ReservationViewSet, "reservation")
router.register(
    r"recurring_reservation", RecurringReservationViewSet, "recurring_reservation"
)
router.register(r"application", ApplicationViewSet, "application")
router.register(r"application_status", ApplicationStatusViewSet, "application_status")
router.register(r"application_event", ApplicationEventViewSet, "application_event")
router.register(
    r"application_event_status",
    ApplicationEventStatusViewSet,
    "application_event_status",
)
router.register(r"application_round", ApplicationRoundViewSet, "application_round")
router.register(r"users", UserViewSet, "user")
router.register(r"unit_role", UnitRoleViewSet, "unit_role")
router.register(r"service_sector_role", ServiceSectorRoleViewSet, "service_sector_role")
router.register(r"general_role", GeneralRoleViewSet, "general_role")
router.register(r"allocation_request", AllocationRequestViewSet, "allocation_request")
router.register(r"allocation_results", AllocationResultViewSet, "allocation_results")
router.register(
    r"application_event_declined_reservation_unit",
    DeclinedReservationUnitViewSet,
    "declined_reservation_unit",
)
router.register(
    r"application_event_weekly_amount_reduction",
    ApplicationEventWeeklyAmountReductionViewSet,
    "application_event_weekly_amount_reduction",
)
router.register(
    r"application_event_calendar",
    ApplicationEventIcalViewset,
    "application_event_calendar",
)
router.register(
    r"reservation_unit_calendar_url",
    ReservationUnitCalendarUrlViewSet,
    "reservation_unit_calendar_url",
)
router.register(
    r"reservation_unit_calendar",
    ReservationUnitIcalViewset,
    "reservation_unit_calendar",
)
router.register(
    r"reservation_calendar",
    ReservationIcalViewset,
    "reservation_calendar",
)


router.register(r"opening_hour", OpeningHoursViewSet, "opening_hour")
router.register(r"parameters/district", DistrictViewSet, "district")
router.register(r"parameters/purpose", ReservationPurposeViewSet, "purpose")
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
router.register(r"parameters/city", CityViewSet, "city")


urlpatterns = [
    path("graphql/", csrf_exempt(FileUploadGraphQLView.as_view(graphiql=True))),
    path(
        "gdpr/v1/user/<str:uuid>/",
        TilavarauspalveluGDPRAPIView.as_view(),
        name="gdpr_v1",
    ),
]
