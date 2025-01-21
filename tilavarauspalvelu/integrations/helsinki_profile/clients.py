from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.utils.functional import classproperty
from graphene_django_extensions.utils import get_nested
from requests import HTTPError
from rest_framework.status import HTTP_200_OK
from social_django.models import DjangoStorage
from social_django.strategy import DjangoStrategy

from config.auth import ProxyTunnistamoOIDCAuthBackend
from tilavarauspalvelu.integrations.helauth.clients import KeyCloakClient
from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.external_service.base_external_service_client import BaseExternalServiceClient
from utils.external_service.errors import ExternalServiceError, ExternalServiceRequestError

from .parsers import ProfileDataParser

if TYPE_CHECKING:
    from requests import Response

    from tilavarauspalvelu.integrations.helauth.typing import RefreshResponse, TokenResponse
    from tilavarauspalvelu.typing import AnyUser, SessionMapping

    from .typing import BirthdayInfo, ProfileData, ReservationPrefillInfo, UserProfileInfo


__all__ = [
    "HelsinkiProfileClient",
]


class HelsinkiProfileClient(BaseExternalServiceClient):
    SERVICE_NAME = "Helsinki Profile"
    REQUEST_TIMEOUT_SECONDS = 5

    # The strategy/storage doesn't matter here.
    oidc_backend = ProxyTunnistamoOIDCAuthBackend(strategy=DjangoStrategy(storage=DjangoStorage()))

    @classmethod
    def get_reservation_prefill_info(cls, *, user: AnyUser, session: SessionMapping) -> ReservationPrefillInfo | None:
        """Fetch reservation prefill info for the request user from Helsinki Profile."""
        my_profile_data = cls.graphql_request(user=user, session=session, query=cls.reservation_prefill_query)
        if my_profile_data is None:
            return None
        return ProfileDataParser(my_profile_data).parse_reservation_prefill_data()

    @classmethod
    def get_birthday_info(cls, *, user: AnyUser, session: SessionMapping) -> BirthdayInfo | None:
        """Fetch profile ID and birthday for the request user from Helsinki profile."""
        my_profile_data = cls.graphql_request(user=user, session=session, query=cls.social_security_number_query)
        if my_profile_data is None:
            return None
        return ProfileDataParser(my_profile_data).parse_birthday_info()

    @classmethod
    def get_user_profile_info(
        cls,
        *,
        user: AnyUser,
        request_user: AnyUser,
        session: SessionMapping,
        fields: list[str],
    ) -> UserProfileInfo | None:
        """Fetch user profile info for the given user from Helsinki Profile."""
        query = cls.user_profile_data(profile_id=user.profile_id, fields=fields)
        my_profile_data = cls.graphql_request(user=request_user, session=session, query=query, endpoint="profile")
        if my_profile_data is None:
            return None
        return ProfileDataParser(my_profile_data).parse_user_profile_info(user=user)

    @classmethod
    def ensure_token_valid(cls, *, user: AnyUser, session: SessionMapping) -> bool:
        """
        Ensure that the request user's helsinki profile JWT is valid. Refresh if necessary.

        :return: True if the user has a valid token, False otherwise.
        """
        return cls.get_token(user=user, session=session) is not None

    @classmethod
    def get_token(cls, *, user: AnyUser, session: SessionMapping) -> str | None:
        """
        Get helsinki profile token from the user session. Refresh if necessary.

        :return: The access token if one is valid or could be refreshed, None otherwise.
        """
        if user.is_anonymous:
            return None

        leeway = 10
        cutoff = local_datetime() - datetime.timedelta(seconds=leeway)
        profile_access_token: str | None = session.get("profile_access_token")
        profile_access_token_expires_at: datetime.datetime | None = session.get("profile_access_token_expires_at")

        if (
            profile_access_token is not None
            and profile_access_token_expires_at is not None
            and profile_access_token_expires_at.astimezone(DEFAULT_TIMEZONE) >= cutoff
        ):
            return profile_access_token

        # If a profile access token was not found or it was expired, try to refresh it.
        return cls.refresh_token(user=user, session=session)

    @classmethod
    def refresh_token(cls, *, user: AnyUser, session: SessionMapping) -> str | None:
        """
        Refresh helsinki profile access token.

        :return: The new access token if refresh was successful, None otherwise.
        """
        if user.is_anonymous:
            return None

        leeway = 10
        cutoff = local_datetime() - datetime.timedelta(seconds=leeway)
        profile_refresh_token: str | None = session.get("profile_refresh_token")
        profile_refresh_token_expires_at: datetime.datetime | None = session.get("profile_refresh_token_expires_at")

        # If it seems like profile token is expired, go straight to keycloak.
        if (
            profile_refresh_token is None
            or profile_refresh_token_expires_at is None
            or profile_refresh_token_expires_at.astimezone(DEFAULT_TIMEZONE) < cutoff
        ):
            access_token = KeyCloakClient.get_token(user=user, session=session)
            if access_token is None:
                return None

        else:
            try:
                # Use the profile refresh token to fetch a 'special' access token from Keycloak that
                # can only be used to fetch new access and refresh tokens for Helsinki profile for the same audience.
                response: RefreshResponse = cls.oidc_backend.refresh_token(token=profile_refresh_token)
                access_token = response["access_token"]
            except HTTPError as error:
                #
                # Last resort, try keycloak refresh
                access_token = KeyCloakClient.refresh_token(user=user, session=session)
                if access_token is None:
                    msg = "Unable to refresh Helsinki profile token"
                    details = {"user": user.pk, "error": error.response.text}
                    SentryLogger.log_message(msg, details=details, level="warning")
                    return None

        try:
            # Fetch new profile tokens.
            response: TokenResponse = cls.oidc_backend.get_token_for_profile(access_token=access_token)
        except HTTPError as error:
            msg = "Unable to get Helsinki profile token"
            details = {"user": user.pk, "error": error.response.text}
            SentryLogger.log_message(msg, details=details, level="warning")
            return None

        now = local_datetime()
        session["profile_access_token"] = response["access_token"]
        session["profile_access_token_expires_at"] = now + datetime.timedelta(seconds=response["expires_in"])
        session["profile_refresh_token"] = response["refresh_token"]
        session["profile_refresh_token_expires_at"] = now + datetime.timedelta(seconds=response["refresh_expires_in"])
        return response["access_token"]

    @classmethod
    def graphql_request(
        cls,
        *,
        user: AnyUser,
        session: SessionMapping,
        query: str,
        endpoint: str = "myProfile",
    ) -> ProfileData | None:
        token = cls.get_token(user=user, session=session)
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
        if response.status_code != HTTP_200_OK:
            raise ExternalServiceRequestError(response, cls.SERVICE_NAME)

        response_data = super().response_json(response)

        errors: dict[str, Any] | None = response_data.get("errors")
        if errors is not None:
            msg = f"{cls.SERVICE_NAME.capitalize()}: Response contains errors."
            SentryLogger.log_message(message=msg, details=errors, level="warning")
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
