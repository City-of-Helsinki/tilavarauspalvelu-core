from __future__ import annotations

from typing import Literal


class permission(classmethod): ...  # noqa: N801


type M2MAction = Literal["pre_add", "post_add", "pre_remove", "post_remove", "pre_clear", "post_clear"]
