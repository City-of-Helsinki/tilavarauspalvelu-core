from __future__ import annotations

from django.urls import path

from .views import palvelukartta_reservation_units

app_name = "palvelukartta"

urlpatterns = [
    path("reservation-units/<str:tprek_id>", palvelukartta_reservation_units, name="reservation_units"),
]
