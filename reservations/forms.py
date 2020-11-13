from django.forms import ModelForm, ValidationError, CharField
from reservations.models import Reservation


class ReservationForm(ModelForm):
    priority = CharField(required=True)

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

    def clean(self):
        cleaned_data = super().clean()
        begin = cleaned_data["begin"]
        end = cleaned_data["end"]
        for reservation_unit in cleaned_data["reservation_unit"]:
            if reservation_unit.check_reservation_overlap(begin, end):
                raise ValidationError("Overlapping reservations are not allowed")
