from __future__ import annotations

import datetime
import logging
import time
from typing import Any

from django.conf import settings
from django.core.handlers.wsgi import WSGIRequest
from graphene_django_extensions.utils import get_nested
from requests import HTTPError
from social_django.models import DjangoStorage
from social_django.strategy import DjangoStrategy

from common.typing import AnyUser
from tilavarauspalvelu.auth import ProxyTunnistamoOIDCAuthBackend
from users.helauth.parsers import ReservationPrefillParser
from users.helauth.typing import (
    ExtraData,
    MyProfileData,
    ProfileTokenPayload,
    RefreshResponse,
    ReservationPrefillInfo,
)
from users.helauth.utils import get_jwt_payload, get_session_data
from utils.external_service.base_external_service_client import BaseExternalServiceClient
from utils.external_service.errors import ExternalServiceError, ExternalServiceRequestError
from utils.sentry import SentryLogger

__all__ = [
    "HelsinkiProfileClient",
    "TunnistamoClient",
]


logger = logging.getLogger(__name__)


class HelsinkiProfileClient(BaseExternalServiceClient):
    SERVICE_NAME = "Helsinki Profile"
    REQUEST_TIMEOUT_SECONDS = 5

    @classmethod
    def get_reservation_prefill_info(cls, request: WSGIRequest) -> ReservationPrefillInfo | None:
        """Fetch reservation prefill info from Helsinki Profile."""
        token = cls.get_token(request)
        if token is None:
            return None

        url: str = settings.OPEN_CITY_PROFILE_GRAPHQL_API
        request_data = {"query": cls._reservation_prefill_query()}
        headers = {"Authorization": f"Bearer {token}"}

        response = cls.post(url=url, json=request_data, headers=headers)

        if response.status_code != 200:
            raise ExternalServiceRequestError(response, cls.SERVICE_NAME)

        response_data = cls.response_json(response)
        errors: dict[str, Any] | None = response_data.get("errors")
        if errors is not None:
            msg = f"{cls.SERVICE_NAME.capitalize()}: Could not read all profile info for prefill operation."
            details = f"User ID: {request.user.pk}. Errors: {errors}"
            SentryLogger.log_message(message=msg, details=details, level="error")
            raise ExternalServiceError(f"{msg} {details}")

        my_profile_data: MyProfileData = get_nested(response_data, "data", "myProfile", default={})
        return ReservationPrefillParser(my_profile_data).parse()

    @classmethod
    def _reservation_prefill_query(cls) -> str:
        primary_email_fragment = """
            fragment MyPrimaryEmail on ProfileNode {
                primaryEmail {
                    email
                    primary
                    emailType
                }
            }
        """
        primary_phone_fragment = """
            fragment MyPrimaryPhone on ProfileNode {
                primaryPhone {
                    phone
                    primary
                    phoneType
                }
            }
        """
        primary_address_fragment = """
            fragment MyPrimaryAddress on ProfileNode {
                primaryAddress {
                    primary
                    address
                    postalCode
                    city
                    countryCode
                    addressType
                }
            }
        """

        emails_fragment = """
            fragment MyEmails on ProfileNode {
                emails {
                    edges {
                        node {
                            email
                            primary
                            emailType
                        }
                    }
                }
            }
        """
        phones_fragment = """
            fragment MyPhones on ProfileNode {
                phones {
                    edges {
                        node {
                            phone
                            primary
                            phoneType
                        }
                    }
                }
            }
        """
        addresses_fragment = """
            fragment MyAddresses on ProfileNode {
                addresses {
                    edges {
                        node {
                            primary
                            address
                            postalCode
                            city
                            countryCode
                            addressType
                        }
                    }
                }
            }
        """

        verified_info_fragment = """
            fragment MyVerifiedPersonalInformation on ProfileNode {
                verifiedPersonalInformation {
                    firstName
                    lastName
                    municipalityOfResidence
                    municipalityOfResidenceNumber
                    permanentAddress {
                         streetAddress
                         postalCode
                         postOffice
                    }
                    permanentForeignAddress {
                        streetAddress
                        additionalAddress
                        countryCode
                    }
                }
            }
        """

        return (
            """
            query {
                myProfile {
                    firstName
                    lastName
                    nickname
                    language
                    ...MyPrimaryEmail
                    ...MyPrimaryPhone
                    ...MyPrimaryAddress
                    ...MyEmails
                    ...MyPhones
                    ...MyAddresses
                    ...MyVerifiedPersonalInformation
                }
            }
            """
            + primary_email_fragment
            + primary_phone_fragment
            + primary_address_fragment
            + emails_fragment
            + phones_fragment
            + addresses_fragment
            + verified_info_fragment
        )

    @classmethod
    def ensure_token_valid(cls, request: WSGIRequest) -> bool:
        """
        Ensure that the request user's helsinki profile JWT is valid. Refresh if necessary.

        :return: True if the user has a valid token, False otherwise.
        """
        return cls.get_token(request) is not None

    @classmethod
    def get_token(cls, request: WSGIRequest) -> str | None:
        """
        Get helsinki profile token from the user session. Refresh if necessary.

        :return: The access token if one is valid or could be refreshed, None otherwise.
        """
        user: AnyUser = request.user
        if user.is_anonymous:
            return None

        session_data = get_session_data(request)
        api_tokens: dict[str, str] | None = session_data.get("api_tokens")
        if api_tokens is None:
            msg = "No api-tokens in session. User is not a helsinki profile user."
            logger.info(msg)
            return None

        token: str | None = api_tokens.get(settings.OPEN_CITY_PROFILE_SCOPE)
        if token is not None:
            payload: ProfileTokenPayload = get_jwt_payload(token)
            leeway = settings.HELSINKI_PROFILE_TOKEN_EXPIRATION_LEEWAY_SECONDS
            is_token_valid = payload["exp"] > int(time.time()) + leeway
            if is_token_valid:
                return token

        # If token or profile was not found in api-tokens, or token was expired, refresh it.
        return cls.refresh_token(request)

    @classmethod
    def refresh_token(cls, request: WSGIRequest) -> str | None:
        """
        Refresh helsinki profile token.

        :return: The new access token if refresh was successful, None otherwise.
        """
        user: AnyUser = request.user
        if user.is_anonymous:
            return None

        access_token = TunnistamoClient.get_token(request)
        if access_token is None:
            msg = "Unable to get tunnistamo access token to refresh profile token."
            logger.info(msg)
            return None

        url = f"{settings.TUNNISTAMO_BASE_URL}/api-tokens/"
        headers: dict[str, str] = {"Authorization": f"Bearer {access_token}"}

        response = cls.post(url=url, headers=headers)

        if response.status_code != 200:
            msg = (
                f"Unable to get API tokens for helsinki profile for user {int(request.user.pk)}: "
                f"[{response.status_code}] {response.text}"
            )
            logger.info(msg)
            return None

        session_data = get_session_data(request)
        session_data["api_tokens"] = cls.response_json(response=response)
        return session_data["api_tokens"].get(settings.OPEN_CITY_PROFILE_SCOPE)


class TunnistamoClient(BaseExternalServiceClient):
    SERVICE_NAME = "Tunnistamo"
    REQUEST_TIMEOUT_SECONDS = 5

    @classmethod
    def ensure_token_valid(cls, request: WSGIRequest) -> None:
        """
        Ensure that the request user's tunnistamo access token is valid. Refresh if necessary.

        :return: True if the user has a valid token, False otherwise.
        """
        return cls.get_token(request) is not None

    @classmethod
    def get_token(cls, request: WSGIRequest) -> str | None:
        """
        Get tunnistamo access token from the user session. Refresh if necessary.

        :return: The access token if one is valid or could be refreshed, None otherwise.
        """
        user: AnyUser = request.user
        if user.is_anonymous:
            return None

        session_data = get_session_data(request)

        leeway = datetime.timedelta(seconds=settings.HELSINKI_PROFILE_TOKEN_EXPIRATION_LEEWAY_SECONDS)
        is_token_valid = session_data["access_token_expires_at"] > datetime.datetime.now() + leeway
        if is_token_valid:
            return session_data["access_token"]

        return cls.refresh_token(request)

    @classmethod
    def refresh_token(cls, request: WSGIRequest) -> str | None:
        """
        Refresh tunnistamo access and refresh tokens.

        :return: The new access token if refresh was successful, None otherwise.
        """
        user: AnyUser = request.user
        if user.is_anonymous:
            return None

        social_auth = user.current_social_auth
        if social_auth is None:
            msg = f"Unable to get `social_auth` for user {int(request.user.pk)}."
            logger.info(msg)
            return None

        extra_data: ExtraData = social_auth.extra_data

        # The strategy/storage doesn't matter here.
        backend = ProxyTunnistamoOIDCAuthBackend(strategy=DjangoStrategy(storage=DjangoStorage()))

        try:
            # Delegate refresh to OAuth backend.
            response: RefreshResponse = backend.refresh_token(token=extra_data["refresh_token"])
        except HTTPError as error:
            msg = f"Unable to refresh token for user {int(request.user.pk)}: {error.response.text}"
            logger.info(msg, exc_info=error)
            return None

        expires_at = datetime.datetime.now() + datetime.timedelta(seconds=response["expires_in"])
        expires_at_ts = int(expires_at.timestamp()) * 1000

        session_data = get_session_data(request)
        session_data["access_token"] = response["access_token"]
        session_data["access_token_expires_at"] = expires_at
        session_data["access_token_expires_at_ts"] = expires_at_ts

        extra_data["id_token"] = response["id_token"]
        extra_data["auth_time"] = int(time.time())
        extra_data["token_type"] = response["token_type"]
        extra_data["refresh_token"] = response["refresh_token"]
        extra_data["access_token"] = response["access_token"]
        social_auth.save(update_fields=["extra_data"])

        return response["access_token"]
