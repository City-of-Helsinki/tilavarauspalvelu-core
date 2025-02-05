from __future__ import annotations

import pytest

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]
