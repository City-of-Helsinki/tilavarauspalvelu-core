from __future__ import annotations

import base64
import json
from typing import TYPE_CHECKING, Any

from django.core.handlers.wsgi import WSGIRequest

from users.helauth.typing import SessionData

if TYPE_CHECKING:
    pass


__all__ = [
    "get_jwt_payload",
    "get_session_data",
]


def get_jwt_payload(json_web_token: str) -> dict[str, Any]:
    payload_part: str = json_web_token.split(".")[1]  # Get the payload part of the id token
    payload_part += "=" * divmod(len(payload_part), 4)[1]  # Add padding to the payload if needed
    payload: str = base64.urlsafe_b64decode(payload_part).decode()  # Decode the payload
    return json.loads(payload)  # Return the payload as a dict


def get_session_data(request: WSGIRequest) -> SessionData:
    # Session is actually a `django.contrib.sessions.backends.base.SessionBase`
    # subclass, but for typing convenience, we hint it as a dict.
    # Session middleware takes care of updating the session cache/cookie when
    # the session data is modified.
    return request.session  # type: ignore[return-value]
