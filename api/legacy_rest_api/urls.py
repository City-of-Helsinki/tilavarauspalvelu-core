from rest_framework import routers

from .views import ReservationIcalViewset

legacy_router = routers.DefaultRouter()
legacy_router.register(r"reservation_calendar", ReservationIcalViewset, "reservation_calendar")
