from api.graphql.extensions.serializers import OldPrimaryKeySerializer
from reservations.models import Reservation


class ReservationWorkingMemoSerializer(OldPrimaryKeySerializer):
    class Meta:
        model = Reservation
        fields = ["pk", "working_memo"]

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.fields["pk"].help_text = "Primary key of the reservation"
