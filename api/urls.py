from django.conf import settings
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from graphene_file_upload.django import FileUploadGraphQLView
from rest_framework import routers

from api.allocation_results_api import AllocationResultViewSet
from api.application_round_api import ApplicationRoundViewSet
from api.applications_api.views import (
    ApplicationEventStatusViewSet,
    ApplicationEventViewSet,
    ApplicationEventWeeklyAmountReductionViewSet,
    ApplicationStatusViewSet,
    ApplicationViewSet,
)
from api.city_api import CityViewSet
from api.declined_reservation_units_api import DeclinedReservationUnitViewSet
from api.gdpr import TilavarauspalveluGDPRAPIView
from api.hauki_api import OpeningHoursViewSet
from api.ical_api import (
    ApplicationEventIcalViewset,
    ReservationIcalViewset,
    ReservationUnitCalendarUrlViewSet,
    ReservationUnitIcalViewset,
)
from api.permissions_api import GeneralRoleViewSet, ServiceSectorRoleViewSet, UnitRoleViewSet
from api.reservation_units_api import (
    EquipmentCategoryViewSet,
    EquipmentViewSet,
    ReservationPurposeViewSet,
    ReservationUnitTypeViewSet,
    ReservationUnitViewSet,
)
from api.reservations_api import AbilityGroupViewSet, AgeGroupViewSet, RecurringReservationViewSet, ReservationViewSet
from api.resources_api import ResourceViewSet
from api.users_api import UserViewSet
from api.webhook_api.views import (
    WebhookOrderViewSet,
    WebhookPaymentViewSet,
    WebhookRefundViewSet,
)

router = routers.DefaultRouter()

router.register(r"reservation_unit", ReservationUnitViewSet, "reservationunit")
router.register(r"resource", ResourceViewSet, "resource")
router.register(r"reservation", ReservationViewSet, "reservation")
router.register(r"recurring_reservation", RecurringReservationViewSet, "recurring_reservation")
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
router.register(r"webhook/payment", WebhookPaymentViewSet, "payment")
router.register(r"webhook/order", WebhookOrderViewSet, "order")
router.register(r"webhook/refund", WebhookRefundViewSet, "refund")
urlpatterns = [
    path("graphql/", csrf_exempt(FileUploadGraphQLView.as_view(graphiql=settings.DEBUG))),  # NOSONAR
    path(
        "gdpr/v1/user/<str:uuid>/",
        TilavarauspalveluGDPRAPIView.as_view(),
        name="gdpr_v1",
    ),
]
