from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import FeatureFlag


__all__ = [
    "FeatureFlagValidator",
]


@dataclasses.dataclass
class FeatureFlagValidator:
    feature_flag: FeatureFlag
