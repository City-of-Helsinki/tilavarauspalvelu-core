from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes

if TYPE_CHECKING:
    from tilavarauspalvelu.models import User


__all__ = [
    "UserValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class UserValidator:
    user: User

    def validate_is_of_age(self) -> None:
        # AD users are always of age (students cannot log in to Varaamo)
        if self.user.actions.is_ad_user or self.user.actions.is_of_age:
            return

        msg = "User is not of age"
        raise ValidationError(msg, code=error_codes.USER_NOT_OF_AGE)
