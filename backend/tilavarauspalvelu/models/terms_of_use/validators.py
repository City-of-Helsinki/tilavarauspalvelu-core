from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.typing import error_codes

if TYPE_CHECKING:
    from tilavarauspalvelu.enums import TermsOfUseTypeChoices
    from tilavarauspalvelu.models import TermsOfUse


__all__ = [
    "TermsOfUseValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class TermsOfUseValidator:
    terms_of_use: TermsOfUse

    def validate_terms_type_not_changed_while_in_use(self, terms_type: TermsOfUseTypeChoices | str) -> None:
        # Each relation to terms of use only allows one terms type, so a type change makes every link invalid.
        if terms_type == self.terms_of_use.terms_type:
            return

        is_in_use = (
            self.terms_of_use.application_rounds.exists()
            or self.terms_of_use.cancellation_terms_reservation_units.exists()
            or self.terms_of_use.service_specific_terms_reservation_units.exists()
            or self.terms_of_use.pricing_terms_reservation_units.exists()
            or self.terms_of_use.payment_terms_reservation_units.exists()
        )
        if is_in_use:
            msg = "Terms type cannot be changed while reservation units or application rounds use these terms."
            raise ValidationError(msg, code=error_codes.TERMS_OF_USE_TYPE_CHANGED_WHILE_IN_USE)
