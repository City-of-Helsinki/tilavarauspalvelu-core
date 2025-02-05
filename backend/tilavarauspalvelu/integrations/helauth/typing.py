from __future__ import annotations

from typing import TYPE_CHECKING, TypedDict

if TYPE_CHECKING:
    from helusers.tunnistamo_oidc import TunnistamoOIDCAuth
    from social_django.models import DjangoStorage, UserSocialAuth
    from social_django.strategy import DjangoStrategy

    from tilavarauspalvelu.models import User
    from tilavarauspalvelu.typing import WSGIRequest

__all__ = [
    "OIDCResponse",
    "PipelineArgs",
    "RefreshResponse",
    "UserDetails",
]

_TokenBase = TypedDict("_TokenBase", {"not-before-policy": int})


class TokenResponse(_TokenBase):
    access_token: str
    expires_in: int
    refresh_expires_in: int
    refresh_token: str
    token_type: bool
    upgraded: bool


class RefreshResponse(_TokenBase):
    access_token: str
    expires_in: int
    id_token: str
    refresh_expires_in: int
    refresh_token: str
    scope: str
    session_state: str
    token_type: str


# Pipeline


class UserDetails(TypedDict):
    email: str
    first_name: str | None
    last_name: str | None
    fullname: str | None
    username: str | None


class OIDCResponse(TypedDict):
    access_token: str
    email: str
    email_verified: bool
    expires_in: int
    id_token: str
    nickname: str
    refresh_token: str
    sub: str
    token_type: str


class PipelineArgs(TypedDict):
    backend: TunnistamoOIDCAuth
    """OAuth2 backend"""

    request: WSGIRequest
    """Login request"""

    response: OIDCResponse
    """Response from Helsinki Tunnistus"""

    user: User | None
    """User instance to log in"""

    details: UserDetails
    """User details from Helsinki Tunnistus"""

    pipeline_index: int
    """Index of the current pipeline step"""

    social: UserSocialAuth
    """Social auth instance used"""

    storage: DjangoStorage
    """Login storage handler"""

    strategy: DjangoStrategy
    """Login strategy used"""

    uid: str
    """User UUID related to Helsinki Tunnistus"""

    username: str
    """Username of the used that should be logged in"""

    redirect_name: str
    """Path to redirect to after login"""

    is_new: bool
    """Whether the user is new."""

    new_association: bool
    """Whether the user to social auth link is new."""
