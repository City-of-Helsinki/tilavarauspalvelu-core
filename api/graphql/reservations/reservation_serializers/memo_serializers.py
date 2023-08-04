from api.graphql.base_serializers import PrimaryKeySerializer
from reservations.models import Reservation


class ReservationWorkingMemoSerializer(PrimaryKeySerializer):
    class Meta:
        model = Reservation
        fields = ["pk", "working_memo"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["pk"].help_text = "Primary key of the reservation"
