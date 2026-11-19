from __future__ import annotations

from waffle.managers import FlagManager

__all__ = [
    "FeatureFlagManager",
]


# Waffle's manager clears the cached list of all flags when a flag is created.
class FeatureFlagManager(FlagManager): ...
