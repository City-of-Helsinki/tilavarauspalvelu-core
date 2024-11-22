from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import MagicMock

if TYPE_CHECKING:
    from tilavarauspalvelu.models import User
    from tilavarauspalvelu.typing import WSGIRequest


def mock_request(user: User) -> WSGIRequest:
    request = MagicMock()
    request.user = user
    return request
