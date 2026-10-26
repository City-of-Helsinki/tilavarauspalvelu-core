from collections.abc import Sequence
from typing import Any, Generic, Literal, TypeVar, overload

from django.db import models
from django.db.models.expressions import Combinable

__all__ = [
    "TextChoicesField",
]

_TSet_contra = TypeVar("_TSet_contra", contravariant=True)
_TGet_co = TypeVar("_TGet_co", covariant=True)
_TChoice = TypeVar("_TChoice", bound=models.TextChoices)

class TextChoicesField(models.CharField[_TSet_contra, _TGet_co], Generic[_TSet_contra, _TGet_co]):  # noqa: UP046
    enum: type[models.TextChoices]

    @overload
    def __init__(
        self: TextChoicesField[str | Combinable, _TChoice],
        enum: type[_TChoice],
        *,
        null: Literal[False] = ...,
        **kwargs: Any,
    ) -> None: ...
    @overload
    def __init__(
        self: TextChoicesField[str | Combinable | None, _TChoice | None],
        enum: type[_TChoice],
        *,
        null: Literal[True],
        **kwargs: Any,
    ) -> None: ...
    def deconstruct(self) -> tuple[str, str, Sequence[str], dict[str, Any]]: ...
    def to_python(self, value: Any) -> Any: ...
    def from_db_value(self, value: Any, expression: Any, connection: Any) -> Any: ...
    def get_prep_value(self, value: Any) -> Any: ...
