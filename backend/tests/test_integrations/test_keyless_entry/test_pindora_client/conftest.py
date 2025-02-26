from __future__ import annotations

import pytest
from django.core.cache import cache


@pytest.fixture(autouse=True)
def clear_pindora_cache():
    cache.clear()
