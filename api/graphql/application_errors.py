from enum import Enum
from typing import Optional

from graphql.error import GraphQLError


class ValidationErrorCodes(Enum):
    pass


class ValidationErrorWithCode(GraphQLError):
    def __init__(
        self,
        message: str,
        error_code: ValidationErrorCodes,
        field: Optional[str] = None,
    ) -> None:
        super().__init__(message, None, None, None, None, None)
        self.extensions = {
            "error_code": error_code.value,
            "field": field or "nonFieldError",
        }
