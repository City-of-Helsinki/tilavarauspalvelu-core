from django.forms import ModelForm
from reservations.models import Reservation


class ReservationForm(ModelForm):
    class Meta:
        model = Reservation
        fields = (
            "state",
            "priority",
            "user",
            "begin",
            "end",
            "buffer_time_before",
            "buffer_time_after",
            "reservation_unit",
        )
