from api.services_api import ServiceViewSet
from rest_framework import routers
from .reservations_api import ReservationViewSet, ReservationUnitViewSet
from .space_api import SpaceViewSet
from .services_api import ServiceViewSet
from .resources_api import ResourceViewSet

router = routers.DefaultRouter()
router.register(r"reservationunits", ReservationUnitViewSet, "reservationunit")
router.register(r"spaces", SpaceViewSet, "space")
router.register(r"services", ServiceViewSet, "service")
router.register(r"resources", ResourceViewSet, "resource")
router.register(r"reservations", ReservationViewSet, "reservation")