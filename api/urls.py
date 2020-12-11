from rest_framework import routers

from .application_period_api import ApplicationPeriodViewSet
from .applications_api import (
    AddressViewSet,
    ApplicationEventViewSet,
    ApplicationViewSet,
    OrganisationViewSet,
    PersonViewSet,
)
from .reservation_units_api import PurposeViewSet, ReservationUnitViewSet
from .reservations_api import ReservationViewSet
from .resources_api import ResourceViewSet
from .services_api import ServiceViewSet
from .space_api import SpaceViewSet

router = routers.DefaultRouter()
router.register(r"reservation_unit", ReservationUnitViewSet, "reservationunit")
router.register(r"space", SpaceViewSet, "space")
router.register(r"service", ServiceViewSet, "service")
router.register(r"resource", ResourceViewSet, "resource")
router.register(r"reservation", ReservationViewSet, "reservation")
router.register(r"application", ApplicationViewSet, "application")
router.register(r"application_event", ApplicationEventViewSet, "applicationevent")
router.register(r"organisation", OrganisationViewSet, "organisation")
router.register(r"address", AddressViewSet, "address")
router.register(r"person", PersonViewSet, "person")
router.register(r"application_period", ApplicationPeriodViewSet, "application_period")
router.register(r"parameters/purpose", PurposeViewSet, "purpose")
