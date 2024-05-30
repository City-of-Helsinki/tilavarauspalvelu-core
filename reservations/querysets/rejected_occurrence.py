from typing import Self

from django.db import models
from lookup_property import L

from reservations.choices import RejectionReadinessChoice


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

    def order_by_rejection_reason(self, *, desc: bool = False) -> Self:
        return self.alias(
            rejection_reason_order=models.Case(
                models.When(
                    rejection_reason=models.Value(RejectionReadinessChoice.INTERVAL_NOT_ALLOWED),
                    then=models.Value(0),
                ),
                models.When(
                    rejection_reason=models.Value(RejectionReadinessChoice.OVERLAPPING_RESERVATIONS),
                    then=models.Value(1),
                ),
                models.When(
                    rejection_reason=models.Value(RejectionReadinessChoice.RESERVATION_UNIT_CLOSED),
                    then=models.Value(2),
                ),
                default=models.Value(3),
                output_field=models.IntegerField(),
            ),
        ).order_by(models.OrderBy(models.F("rejection_reason_order"), descending=desc))
