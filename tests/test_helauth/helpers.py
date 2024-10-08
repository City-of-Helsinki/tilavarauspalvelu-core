from unittest.mock import MagicMock

from django.core.handlers.wsgi import WSGIRequest

from tilavarauspalvelu.models import User


def mock_request(user: User) -> WSGIRequest:
    request = MagicMock()
    request.user = user
    return request
