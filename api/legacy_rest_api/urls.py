from rest_framework import routers

from .views import RecurringReservationViewSet, ReservationIcalViewset, ReservationUnitViewSet, ReservationViewSet

legacy_outer = routers.DefaultRouter()

legacy_outer.register(r"reservation_unit", ReservationUnitViewSet, "reservationunit")
legacy_outer.register(r"reservation", ReservationViewSet, "reservation")
legacy_outer.register(r"recurring_reservation", RecurringReservationViewSet, "recurring_reservation")
legacy_outer.register(r"reservation_calendar", ReservationIcalViewset, "reservation_calendar")
