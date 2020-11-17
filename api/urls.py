from api.services_api import ServiceViewSet
from rest_framework import routers

from .applications_api import (
    ApplicationViewSet,
    ApplicationEventViewSet,
    OrganisationViewSet,
    AddressViewSet,
    PersonViewSet,
)
from .reservations_api import ReservationViewSet
from .reservation_units_api import ReservationUnitViewSet
from .space_api import SpaceViewSet
from .services_api import ServiceViewSet
from .resources_api import ResourceViewSet

router = routers.DefaultRouter()
router.register(r"reservationunits", ReservationUnitViewSet, "reservationunit")
router.register(r"spaces", SpaceViewSet, "space")
router.register(r"services", ServiceViewSet, "service")
router.register(r"resources", ResourceViewSet, "resource")
router.register(r"reservations", ReservationViewSet, "reservation")
router.register(r"applications", ApplicationViewSet, "application")
router.register(r"applicationevents", ApplicationEventViewSet, "applicationevent")
router.register(r"organisations", OrganisationViewSet, "organisation")
router.register(r"addresses", AddressViewSet, "address")
router.register(r"persons", PersonViewSet, "person")
