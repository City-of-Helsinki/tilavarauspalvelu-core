from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from undine.exceptions import GraphQLValidationError

from tilavarauspalvelu.enums import AccessType
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_date

if TYPE_CHECKING:
    import datetime

    from .model import ReservationUnitAccessType


__all__ = [
    "ReservationUnitAccessTypeValidator",
]


@dataclasses.dataclass(frozen=True, slots=True)
class ReservationUnitAccessTypeValidator:
    access_type: ReservationUnitAccessType

    @classmethod
    def validate_new_not_in_past(cls, begin_date: datetime.date) -> None:
        if begin_date < local_date():
            msg = "Access type cannot be created in the past."
            raise GraphQLValidationError(msg, code=error_codes.ACCESS_TYPE_BEGIN_DATE_IN_PAST)

    @classmethod
    def validate_not_access_code(cls, access_type: AccessType | str) -> None:
        if access_type == AccessType.ACCESS_CODE:
            msg = "Cannot set access type to access code on reservation unit create."
            raise GraphQLValidationError(msg, code=error_codes.ACCESS_TYPE_ACCESS_CODE_ON_CREATE)

    def validate_not_past(self, begin_date: datetime.date) -> None:
        if self.access_type.begin_date != begin_date and self.access_type.begin_date <= local_date():
            msg = "Past of active access type begin date cannot be changed."
            raise GraphQLValidationError(msg, code=error_codes.ACCESS_TYPE_CANNOT_BE_MOVED)

    def validate_not_moved_to_past(self, begin_date: datetime.date) -> None:
        if self.access_type.begin_date != begin_date and begin_date < local_date():
            msg = "Access type cannot be moved to the past."
            raise GraphQLValidationError(msg, code=error_codes.ACCESS_TYPE_BEGIN_DATE_IN_PAST)

    def validate_deleted_not_active_or_past(self) -> None:
        if self.access_type.begin_date <= local_date():
            msg = "Cannot delete past or active access type."
            raise GraphQLValidationError(msg, code=error_codes.ACCESS_TYPE_CANNOT_DELETE_PAST_OR_ACTIVE)
