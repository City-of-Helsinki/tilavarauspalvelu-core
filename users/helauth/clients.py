from __future__ import annotations

import datetime
import logging
import time
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.utils.functional import classproperty
from graphene_django_extensions.utils import get_nested
from requests import HTTPError, Response
from social_django.models import DjangoStorage
from social_django.strategy import DjangoStrategy

from tilavarauspalvelu.auth import ProxyTunnistamoOIDCAuthBackend
from users.helauth.parsers import ProfileDataParser
from users.helauth.utils import get_jwt_payload, get_session_data
from utils.external_service.base_external_service_client import BaseExternalServiceClient
from utils.external_service.errors import ExternalServiceError, ExternalServiceRequestError
from utils.sentry import SentryLogger

if TYPE_CHECKING:
    from django.core.handlers.wsgi import WSGIRequest

    from common.typing import AnyUser
    from users.helauth.typing import (
        BirthdayInfo,
        ExtraData,
        ProfileData,
        ProfileTokenPayload,
        RefreshResponse,
        ReservationPrefillInfo,
        UserProfileInfo,
    )
    from users.models import User


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
        """Fetch reservation prefill info for the request user from Helsinki Profile."""
        my_profile_data = cls.graphql_request(request, query=cls.reservation_prefill_query)
        if my_profile_data is None:
            return None
        return ProfileDataParser(my_profile_data).parse_reservation_prefill_data()

    @classmethod
    def get_birthday_info(cls, request: WSGIRequest) -> BirthdayInfo | None:
        """Fetch profile ID and birthday for the request user from Helsinki profile."""
        my_profile_data = cls.graphql_request(request, query=cls.social_security_number_query)
        if my_profile_data is None:
            return None
        return ProfileDataParser(my_profile_data).parse_birthday_info()

    @classmethod
    def get_user_profile_info(cls, request: WSGIRequest, *, user: User, fields: list[str]) -> UserProfileInfo | None:
        """Fetch user profile info for the given user from Helsinki Profile."""
        query = cls.user_profile_data(profile_id=user.profile_id, fields=fields)
        my_profile_data = cls.graphql_request(request, query=query, endpoint="profile")
        if my_profile_data is None:
            return None
        return ProfileDataParser(my_profile_data).parse_user_profile_info(user=user)

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
        session_data["api_tokens"] = BaseExternalServiceClient.response_json(response=response)
        return session_data["api_tokens"].get(settings.OPEN_CITY_PROFILE_SCOPE)

    @classmethod
    def graphql_request(cls, request: WSGIRequest, *, query: str, endpoint: str = "myProfile") -> ProfileData | None:
        token = cls.get_token(request)
        if token is None:
            return None

        url: str = settings.OPEN_CITY_PROFILE_GRAPHQL_API
        request_data = {"query": query}
        headers = {"Authorization": f"Bearer {token}"}

        response = cls.post(url=url, json=request_data, headers=headers)
        response_data = cls.response_json(response)

        return get_nested(response_data, "data", endpoint, default={})

    @classmethod
    def response_json(cls, response: Response) -> dict[str, Any]:
        if response.status_code != 200:
            raise ExternalServiceRequestError(response, cls.SERVICE_NAME)

        response_data = super().response_json(response)

        errors: dict[str, Any] | None = response_data.get("errors")
        if errors is not None:
            msg = f"{cls.SERVICE_NAME.capitalize()}: Response contains errors."
            SentryLogger.log_message(message=msg, details=errors, level="error")
            raise ExternalServiceError(msg, details=errors)

        return response_data

    @classproperty
    def reservation_prefill_query(cls) -> str:
        return (
            """
            query {
                myProfile {
                    firstName
                    lastName
                    ...PrimaryEmail
                    ...PrimaryPhone
                    ...PrimaryAddress
                    ...Emails
                    ...Phones
                    ...Addresses
                    ...VerifiedPersonalInformation
                }
            }
            """
            + cls._primary_email_fragment
            + cls._primary_phone_fragment
            + cls._primary_address_fragment
            + cls._emails_fragment
            + cls._phones_fragment
            + cls._addresses_fragment
            + cls._verified_info_fragment
        )

    @classproperty
    def social_security_number_query(cls) -> str:
        return """
            query {
                myProfile {
                    id
                    verifiedPersonalInformation {
                        nationalIdentificationNumber
                    }
                }
            }
        """

    @classmethod
    def user_profile_data(cls, *, profile_id: str, fields: list[str]) -> str:
        node = f'profile(id:"{profile_id}")'
        selections: set[str] = set()
        fragments: set[str] = set()

        if "first_name" in fields:
            selections.add("firstName")
            selections.add("...VerifiedPersonalInformation")
            fragments.add(cls._verified_info_fragment)

        if "last_name" in fields:
            selections.add("lastName")
            selections.add("...VerifiedPersonalInformation")
            fragments.add(cls._verified_info_fragment)

        if "email" in fields:
            selections.add("...PrimaryEmail")
            selections.add("...Emails")
            fragments.add(cls._primary_email_fragment)
            fragments.add(cls._emails_fragment)

        if "phone" in fields:
            selections.add("...PrimaryPhone")
            selections.add("...Phones")
            fragments.add(cls._primary_phone_fragment)
            fragments.add(cls._phones_fragment)

        if any(f in fields for f in ["street_address", "postal_code", "city"]):
            selections.add("...PrimaryAddress")
            selections.add("...Addresses")
            selections.add("...VerifiedPersonalInformation")
            fragments.add(cls._primary_address_fragment)
            fragments.add(cls._addresses_fragment)
            fragments.add(cls._verified_info_fragment)

        if any(f in fields for f in ["birthday", "ssn", "municipality_code", "municipality_name", "is_strong_login"]):
            selections.add("...VerifiedPersonalInformation")
            fragments.add(cls._verified_info_fragment)

        return (
            "query { %s { %s } }" % (node, " ".join(selections))  # noqa: UP031
            + " ".join(fragments)
        )

    @classproperty
    def _primary_email_fragment(cls) -> str:
        return """
            fragment PrimaryEmail on ProfileNode {
                primaryEmail {
                    email
                    primary
                    emailType
                }
            }
        """

    @classproperty
    def _primary_phone_fragment(cls) -> str:
        return """
            fragment PrimaryPhone on ProfileNode {
                primaryPhone {
                    phone
                    primary
                    phoneType
                }
            }
        """

    @classproperty
    def _primary_address_fragment(cls) -> str:
        return """
            fragment PrimaryAddress on ProfileNode {
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

    @classproperty
    def _emails_fragment(cls) -> str:
        return """
            fragment Emails on ProfileNode {
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

    @classproperty
    def _phones_fragment(cls) -> str:
        return """
            fragment Phones on ProfileNode {
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

    @classproperty
    def _addresses_fragment(cls) -> str:
        return """
            fragment Addresses on ProfileNode {
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

    @classproperty
    def _permanent_address(cls) -> str:
        return """
            fragment PermanentAddress on VerifiedPersonalInformationNode {
                permanentAddress {
                    streetAddress
                    postalCode
                    postOffice
                }
            }
        """

    @classproperty
    def _permanent_foreign_address(cls) -> str:
        return """
            fragment PermanentForeignAddress on VerifiedPersonalInformationNode {
                permanentForeignAddress {
                    streetAddress
                    additionalAddress
                    countryCode
                }
            }
        """

    @classproperty
    def _verified_info_fragment(cls) -> str:
        return (
            """
            fragment VerifiedPersonalInformation on ProfileNode {
                verifiedPersonalInformation {
                    firstName
                    lastName
                    nationalIdentificationNumber
                    municipalityOfResidence
                    municipalityOfResidenceNumber
                    ...PermanentAddress
                    ...PermanentForeignAddress
                }
            }
            """
            + cls._permanent_address
            + cls._permanent_foreign_address
        )


class TunnistamoClient(BaseExternalServiceClient):
    SERVICE_NAME = "Tunnistamo"
    REQUEST_TIMEOUT_SECONDS = 5

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
