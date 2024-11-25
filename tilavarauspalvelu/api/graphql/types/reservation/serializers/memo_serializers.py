from __future__ import annotations

from typing import Any

from tilavarauspalvelu.api.graphql.extensions.serializers import OldPrimaryKeySerializer
from tilavarauspalvelu.models import Reservation


class ReservationWorkingMemoSerializer(OldPrimaryKeySerializer):
    class Meta:
        model = Reservation
        fields = ["pk", "working_memo"]

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        super().__init__(*args, **kwargs)
        self.fields["pk"].help_text = "Primary key of the reservation"
