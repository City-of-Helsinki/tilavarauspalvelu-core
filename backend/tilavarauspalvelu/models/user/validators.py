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

    def validate_is_of_age(self, *, code: str = error_codes.USER_NOT_OF_AGE) -> None:
        if self.user.actions.is_of_age:
            return

        # AD users are currently never under age since we have blocked students from signing in.
        if self.user.actions.is_ad_user:
            # Except there can be some guest-users whose age we don't know.
            if not self.user.actions.is_internal_user:
                # But allow superusers to be external/guest users.
                if self.user.is_superuser:
                    return

                msg = "AD user is not an internal user. Cannot verify age."
                raise ValidationError(msg, code=code)

            return

        msg = "User is not of age"
        raise ValidationError(msg, code=code)

    def validate_is_internal_user_if_ad_user(self) -> None:
        # Superusers can be external/guest users (e.g. developers)
        if self.user.is_superuser:
            return

        if self.user.actions.is_ad_user and not self.user.actions.is_internal_user:
            msg = "AD user is not an internal user."
            raise ValidationError(msg, code=error_codes.USER_NOT_INTERNAL_USER)
