from typing import Self

from django.db import models
from lookup_property import L


class RejectedOccurrenceQuerySet(models.QuerySet):
    def order_by_applicant(self, *, desc: bool = False) -> Self:
        applicant_ref = (
            "recurring_reservation"
            "__allocated_time_slot"
            "__reservation_unit_option"
            "__application_section"
            "__application"
            "__applicant"
        )
        return self.order_by(L(applicant_ref).order_by(descending=desc))
