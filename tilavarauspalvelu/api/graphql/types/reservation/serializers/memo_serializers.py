from reservations.models import Reservation
from tilavarauspalvelu.api.graphql.extensions.serializers import OldPrimaryKeySerializer


class ReservationWorkingMemoSerializer(OldPrimaryKeySerializer):
    class Meta:
        model = Reservation
        fields = ["pk", "working_memo"]

    def __init__(self, *args, **kwargs) -> None:
        super().__init__(*args, **kwargs)
        self.fields["pk"].help_text = "Primary key of the reservation"
