from __future__ import annotations

import datetime
import uuid

import pytest
from dateutil.relativedelta import relativedelta
from django.urls import reverse
from freezegun import freeze_time
from rest_framework.exceptions import ErrorDetail

from tilavarauspalvelu.enums import OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

from tests.factories import ApplicationFactory, PaymentOrderFactory, ReservationFactory, UserFactory
from tests.helpers import patch_method

from .helpers import get_gdpr_auth_header, patch_oidc_config

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# QUERY


def test_query_user_data__simple(api_client, settings):
    user = UserFactory.create()

    settings.GDPR_API_QUERY_SCOPE = "gdprquery"
    auth_header = get_gdpr_auth_header(user, scopes=[settings.GDPR_API_QUERY_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(user.uuid)})
    with patch_oidc_config():
        response = api_client.get(url)

    assert response.status_code == 200, response.data
    assert response.data == {
        "key": "PROFILEUSER",
        "children": [
            {
                "key": "USER",
                "value": user.get_full_name(),
            },
            {
                "key": "EMAIL",
                "value": user.email,
            },
            {
                "key": "DATE_OF_BIRTH",
                "value": user.date_of_birth,
            },
            {
                "key": "RESERVATIONS",
                "children": [],
            },
            {
                "key": "APPLICATIONS",
                "children": [],
            },
        ],
    }


def test_query_user_data__full(api_client, settings):
    user = UserFactory.create()
    application = ApplicationFactory.create_in_status_in_allocation(user=user)
    section = application.application_sections.first()
    reservation = ReservationFactory.create(user=user)

    settings.GDPR_API_QUERY_SCOPE = "gdprquery"
    auth_header = get_gdpr_auth_header(user, scopes=[settings.GDPR_API_QUERY_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(user.uuid)})
    with patch_oidc_config():
        response = api_client.get(url)

    assert response.status_code == 200, response.data
    assert response.data == {
        "key": "PROFILEUSER",
        "children": [
            {
                "key": "USER",
                "value": user.get_full_name(),
            },
            {
                "key": "EMAIL",
                "value": user.email,
            },
            {
                "key": "DATE_OF_BIRTH",
                "value": user.date_of_birth,
            },
            {
                "key": "RESERVATIONS",
                "children": [
                    {
                        "key": "RESERVATION",
                        "children": [
                            {
                                "key": "NAME",
                                "value": reservation.name,
                            },
                            {
                                "key": "DESCRIPTION",
                                "value": reservation.description,
                            },
                            {
                                "key": "BEGINS_AT",
                                "value": reservation.begins_at,
                            },
                            {
                                "key": "ENDS_AT",
                                "value": reservation.ends_at,
                            },
                            {
                                "key": "RESERVEE_FIRST_NAME",
                                "value": reservation.reservee_first_name,
                            },
                            {
                                "key": "RESERVEE_LAST_NAME",
                                "value": reservation.reservee_last_name,
                            },
                            {
                                "key": "RESERVEE_EMAIL",
                                "value": reservation.reservee_email,
                            },
                            {
                                "key": "RESERVEE_PHONE",
                                "value": reservation.reservee_phone,
                            },
                            {
                                "key": "RESERVEE_ADDRESS_ZIP",
                                "value": reservation.reservee_address_zip,
                            },
                            {
                                "key": "RESERVEE_IDENTIFIER",
                                "value": reservation.reservee_identifier,
                            },
                            {
                                "key": "RESERVEE_ORGANISATION_NAME",
                                "value": reservation.reservee_organisation_name,
                            },
                            {
                                "key": "FREE_OF_CHARGE_REASON",
                                "value": reservation.free_of_charge_reason,
                            },
                            {
                                "key": "CANCEL_DETAILS",
                                "value": reservation.cancel_details,
                            },
                        ],
                    },
                ],
            },
            {
                "key": "APPLICATIONS",
                "children": [
                    {
                        "key": "APPLICATION",
                        "children": [
                            {
                                "key": "ADDITIONAL_INFORMATION",
                                "value": application.additional_information,
                            },
                            {
                                "key": "CONTACT_PERSON_FIRST_NAME",
                                "value": application.contact_person_first_name,
                            },
                            {
                                "key": "CONTACT_PERSON_LAST_NAME",
                                "value": application.contact_person_last_name,
                            },
                            {
                                "key": "CONTACT_PERSON_EMAIL",
                                "value": application.contact_person_email,
                            },
                            {
                                "key": "CONTACT_PERSON_PHONE_NUMBER",
                                "value": application.contact_person_phone_number,
                            },
                            {
                                "key": "BILLING_STREET_ADDRESS",
                                "value": application.billing_street_address,
                            },
                            {
                                "key": "BILLING_POST_CODE",
                                "value": application.billing_post_code,
                            },
                            {
                                "key": "BILLING_CITY",
                                "value": application.billing_city,
                            },
                            {
                                "key": "ORGANISATION_NAME",
                                "value": application.organisation_name,
                            },
                            {
                                "key": "ORGANISATION_IDENTIFIER",
                                "value": application.organisation_identifier,
                            },
                            {
                                "key": "ORGANISATION_EMAIL",
                                "value": application.organisation_email,
                            },
                            {
                                "key": "ORGANISATION_CORE_BUSINESS",
                                "value": application.organisation_core_business,
                            },
                            {
                                "key": "ORGANISATION_STREET_ADDRESS",
                                "value": application.organisation_street_address,
                            },
                            {
                                "key": "ORGANISATION_POST_CODE",
                                "value": application.organisation_post_code,
                            },
                            {
                                "key": "ORGANISATION_CITY",
                                "value": application.organisation_city,
                            },
                            {
                                "key": "APPLICATION_SECTIONS",
                                "children": [
                                    {
                                        "key": "APPLICATIONSECTION",
                                        "children": [
                                            {
                                                "key": "NAME",
                                                "value": section.name,
                                            },
                                        ],
                                    }
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    }


@patch_method(SentryLogger.log_message)
def test_query_user_data__user_not_found(api_client, settings):
    user = UserFactory.create()

    settings.GDPR_API_QUERY_SCOPE = "gdprquery"
    auth_header = get_gdpr_auth_header(user, scopes=[settings.GDPR_API_QUERY_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(uuid.uuid4())})
    with patch_oidc_config():
        response = api_client.get(url)

    assert response.status_code == 404, response.data
    assert response.data == {"detail": "No ProfileUser matches the given query."}

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args == ("GDPR API query failed.",)
    assert SentryLogger.log_message.call_args.kwargs == {
        "details": {
            "detail": ErrorDetail(
                string="No ProfileUser matches the given query.",
                code="not_found",
            )
        }
    }


@patch_method(SentryLogger.log_message)
def test_query_user_data__cannot_access_other_users_data(api_client, settings):
    user = UserFactory.create(username="foo", uuid=uuid.uuid4())
    other_user = UserFactory.create(username="bar", uuid=uuid.uuid4())

    settings.GDPR_API_QUERY_SCOPE = "gdprquery"
    auth_header = get_gdpr_auth_header(user, scopes=[settings.GDPR_API_QUERY_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(other_user.uuid)})
    with patch_oidc_config():
        response = api_client.get(url)

    assert response.status_code == 403, response.data
    assert response.data == {"detail": "You do not have permission to perform this action."}

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args == ("GDPR API GET request can't access data for user.",)
    assert SentryLogger.log_message.call_args.kwargs == {
        "details": {
            "request_user_id": str(user.id),
            "request_user_uuid": str(user.uuid),
            "target_user_id": str(other_user.id),
            "target_user_uuid": str(other_user.uuid),
        }
    }


@patch_method(SentryLogger.log_message)
def test_query_user_data__not_authenticated(api_client, settings):
    user = UserFactory.create()

    settings.GDPR_API_QUERY_SCOPE = "gdprquery"

    url = reverse("gdpr_v1", kwargs={"uuid": str(user.uuid)})
    with patch_oidc_config():
        response = api_client.get(url)

    assert response.status_code == 401, response.data
    assert response.data == {"detail": "Authentication credentials were not provided."}

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args == ("GDPR API GET request not authenticated.",)


@patch_method(SentryLogger.log_message)
@freeze_time("2024-01-01T00:00:00")
def test_query_user_data__wrong_scope(api_client, settings):
    user = UserFactory.create()

    settings.GDPR_API_QUERY_SCOPE = "gdprquery"
    auth_header = get_gdpr_auth_header(user, scopes=["invalid"])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(uuid.uuid4())})
    with patch_oidc_config():
        response = api_client.get(url)

    assert response.status_code == 403, response.data
    assert response.data == {"detail": "You do not have permission to perform this action."}

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args == ("GDPR API GET permission check failed.",)
    assert SentryLogger.log_message.call_args.kwargs == {
        "details": {
            "request_method": "GET",
            "allowed_loa": ["substantial", "high"],
            "required_query_scope": "gdprquery",
            "required_delete_scope": "gdprdelete",
            "auth_claims": {
                "aud": "TUNNISTAMO_AUDIENCE",
                "authorization": {"permissions": [{"scopes": ["invalid"]}]},
                "exp": 1705276800,
                "iat": 1704067200,
                "iss": "TUNNISTAMO_ISSUER",
                "loa": "high",
                "sub": str(user.uuid),
            },
        }
    }


@patch_method(SentryLogger.log_message)
@freeze_time("2024-01-01T00:00:00")
def test_query_user_data__insufficient_loa(api_client, settings):
    user = UserFactory.create(username="foo")

    settings.GDPR_API_QUERY_SCOPE = "gdprquery"
    auth_header = get_gdpr_auth_header(user, scopes=[settings.GDPR_API_QUERY_SCOPE], loa="low")
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(user.uuid)})
    with patch_oidc_config():
        response = api_client.get(url)

    assert response.status_code == 403, response.data
    assert response.data == {"detail": "You do not have permission to perform this action."}
    user.refresh_from_db()
    assert user.username == "foo"

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args == ("GDPR API GET permission check failed.",)
    assert SentryLogger.log_message.call_args.kwargs == {
        "details": {
            "request_method": "GET",
            "allowed_loa": ["substantial", "high"],
            "required_query_scope": "gdprquery",
            "required_delete_scope": "gdprdelete",
            "auth_claims": {
                "aud": "TUNNISTAMO_AUDIENCE",
                "authorization": {"permissions": [{"scopes": ["gdprquery"]}]},
                "exp": 1705276800,
                "iat": 1704067200,
                "iss": "TUNNISTAMO_ISSUER",
                "loa": "low",
                "sub": str(user.uuid),
            },
        }
    }


# DELETE


def test_delete_user_data__should_anonymize(api_client, settings):
    user = UserFactory.create(username="foo")

    settings.GDPR_API_DELETE_SCOPE = "gdprdelete"
    auth_header = get_gdpr_auth_header(user, scopes=[settings.GDPR_API_DELETE_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(user.uuid)})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 204, response.data

    user.refresh_from_db()
    assert user.username == f"anonymized-{user.uuid}"


def test_delete_user_data__has_trailing_slash(api_client, settings):
    # Makes sure that the endpoint works with or without a trailing slash
    # since delete request cannot be forwarded if the trailing slash is missing.
    user = UserFactory.create(username="foo")

    settings.GDPR_API_DELETE_SCOPE = "gdprdelete"
    auth_header = get_gdpr_auth_header(user, scopes=[settings.GDPR_API_DELETE_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(user.uuid)}) + "/"
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 204, response.data

    user.refresh_from_db()
    assert user.username == f"anonymized-{user.uuid}"


def test_delete_user_data__dont_anonymize_if_open_payments(api_client, settings):
    user = UserFactory.create(username="foo")
    reservation = ReservationFactory.create(
        user=user,
        begins_at=datetime.datetime(2020, 1, 1, 12, tzinfo=DEFAULT_TIMEZONE),
        ends_at=datetime.datetime(2020, 1, 1, 14, tzinfo=DEFAULT_TIMEZONE),
    )
    PaymentOrderFactory.create(reservation=reservation, status=OrderStatus.DRAFT, remote_id=uuid.uuid4())

    settings.GDPR_API_DELETE_SCOPE = "gdprdelete"
    auth_header = get_gdpr_auth_header(user, scopes=[settings.GDPR_API_DELETE_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(user.uuid)})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 403, response.data
    assert response.data == {
        "errors": [
            {
                "code": "PAYMENT",
                "message": {
                    "en": "User has open payments.",
                    "fi": "User has open payments.",
                    "sv": "User has open payments.",
                },
            }
        ]
    }
    user.refresh_from_db()
    assert user.username == "foo"


def test_delete_user_data__dont_anonymize_if_open_reservations(api_client, settings):
    user = UserFactory.create(username="foo")
    begin = local_datetime()
    end = begin + datetime.timedelta(hours=2)
    ReservationFactory.create(user=user, begins_at=begin, ends_at=end, state=ReservationStateChoice.CREATED)

    settings.GDPR_API_DELETE_SCOPE = "gdprdelete"
    auth_header = get_gdpr_auth_header(user, scopes=[settings.GDPR_API_DELETE_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(user.uuid)})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 403, response.data
    assert response.data == {
        "errors": [
            {
                "code": "RESERVATION",
                "message": {
                    "en": "User has upcoming or too recent reservations.",
                    "fi": "User has upcoming or too recent reservations.",
                    "sv": "User has upcoming or too recent reservations.",
                },
            }
        ]
    }
    user.refresh_from_db()
    assert user.username == "foo"


def test_delete_user_data__dont_anonymize_if_reservation_one_month_ago(api_client, settings):
    user = UserFactory.create(username="foo")
    begin = local_datetime() - relativedelta(months=1)
    end = begin + datetime.timedelta(hours=2)
    ReservationFactory.create(user=user, begins_at=begin, ends_at=end, state=ReservationStateChoice.CONFIRMED)

    settings.GDPR_API_DELETE_SCOPE = "gdprdelete"
    auth_header = get_gdpr_auth_header(user, scopes=[settings.GDPR_API_DELETE_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(user.uuid)})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 403, response.data
    assert response.data == {
        "errors": [
            {
                "code": "RESERVATION",
                "message": {
                    "en": "User has upcoming or too recent reservations.",
                    "fi": "User has upcoming or too recent reservations.",
                    "sv": "User has upcoming or too recent reservations.",
                },
            }
        ]
    }
    user.refresh_from_db()
    assert user.username == "foo"


def test_delete_user_data__dont_anonymize_if_open_applications(api_client, settings):
    user = UserFactory.create(username="foo")
    ApplicationFactory.create_in_status_in_allocation(user=user)

    settings.GDPR_API_DELETE_SCOPE = "gdprdelete"
    auth_header = get_gdpr_auth_header(user, scopes=[settings.GDPR_API_DELETE_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(user.uuid)})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 403, response.data
    assert response.data == {
        "errors": [
            {
                "code": "APPLICATION",
                "message": {
                    "en": "User has an unhandled application.",
                    "fi": "User has an unhandled application.",
                    "sv": "User has an unhandled application.",
                },
            }
        ]
    }
    user.refresh_from_db()
    assert user.username == "foo"


@patch_method(SentryLogger.log_message)
def test_delete_user_data__user_not_found(api_client, settings):
    user = UserFactory.create()

    settings.GDPR_API_DELETE_SCOPE = "gdprdelete"
    auth_header = get_gdpr_auth_header(user, scopes=[settings.GDPR_API_DELETE_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(uuid.uuid4())})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 404, response.data
    assert response.data == {"detail": "No ProfileUser matches the given query."}

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args == ("GDPR API query failed.",)
    assert SentryLogger.log_message.call_args.kwargs == {
        "details": {
            "detail": ErrorDetail(
                string="No ProfileUser matches the given query.",
                code="not_found",
            )
        }
    }


@patch_method(SentryLogger.log_message)
def test_delete_user_data__cannot_anonymize_other_users_data(api_client, settings):
    user = UserFactory.create(username="foo", uuid=uuid.uuid4())
    other_user = UserFactory.create(username="bar", uuid=uuid.uuid4())

    settings.GDPR_API_DELETE_SCOPE = "gdprdelete"
    auth_header = get_gdpr_auth_header(user, scopes=[settings.GDPR_API_DELETE_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(other_user.uuid)})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 403, response.data
    assert response.data == {"detail": "You do not have permission to perform this action."}
    other_user.refresh_from_db()
    assert other_user.username == "bar"

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args == ("GDPR API DELETE request can't access data for user.",)
    assert SentryLogger.log_message.call_args.kwargs == {
        "details": {
            "request_user_id": str(user.id),
            "request_user_uuid": str(user.uuid),
            "target_user_id": str(other_user.id),
            "target_user_uuid": str(other_user.uuid),
        }
    }


@patch_method(SentryLogger.log_message)
def test_delete_user_data__not_authenticated(api_client, settings):
    user = UserFactory.create(username="foo")

    settings.GDPR_API_DELETE_SCOPE = "gdprdelete"

    url = reverse("gdpr_v1", kwargs={"uuid": str(user.uuid)})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 401, response.data
    assert response.data == {"detail": "Authentication credentials were not provided."}
    user.refresh_from_db()
    assert user.username == "foo"

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args == ("GDPR API DELETE request not authenticated.",)


@patch_method(SentryLogger.log_message)
@freeze_time("2024-01-01T00:00:00")
def test_delete_user_data__wrong_scope(api_client, settings):
    user = UserFactory.create(username="foo")

    settings.GDPR_API_DELETE_SCOPE = "gdprdelete"
    auth_header = get_gdpr_auth_header(user, scopes=["invalid"])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(user.uuid)})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 403, response.data
    assert response.data == {"detail": "You do not have permission to perform this action."}
    user.refresh_from_db()
    assert user.username == "foo"

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args == ("GDPR API DELETE permission check failed.",)
    assert SentryLogger.log_message.call_args.kwargs == {
        "details": {
            "request_method": "DELETE",
            "allowed_loa": ["substantial", "high"],
            "required_query_scope": "gdprquery",
            "required_delete_scope": "gdprdelete",
            "auth_claims": {
                "aud": "TUNNISTAMO_AUDIENCE",
                "authorization": {"permissions": [{"scopes": ["invalid"]}]},
                "exp": 1705276800,
                "iat": 1704067200,
                "iss": "TUNNISTAMO_ISSUER",
                "loa": "high",
                "sub": str(user.uuid),
            },
        }
    }


@patch_method(SentryLogger.log_message)
@freeze_time("2024-01-01T00:00:00")
def test_delete_user_data__insufficient_loa(api_client, settings):
    user = UserFactory.create(username="foo")

    settings.GDPR_API_DELETE_SCOPE = "gdprdelete"
    auth_header = get_gdpr_auth_header(user, scopes=[settings.GDPR_API_DELETE_SCOPE], loa="low")
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(user.uuid)})
    with patch_oidc_config():
        response = api_client.delete(url)

    assert response.status_code == 403, response.data
    assert response.data == {"detail": "You do not have permission to perform this action."}
    user.refresh_from_db()
    assert user.username == "foo"

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_message.call_args.args == ("GDPR API DELETE permission check failed.",)
    assert SentryLogger.log_message.call_args.kwargs == {
        "details": {
            "request_method": "DELETE",
            "allowed_loa": ["substantial", "high"],
            "required_query_scope": "gdprquery",
            "required_delete_scope": "gdprdelete",
            "auth_claims": {
                "aud": "TUNNISTAMO_AUDIENCE",
                "authorization": {"permissions": [{"scopes": ["gdprdelete"]}]},
                "exp": 1705276800,
                "iat": 1704067200,
                "iss": "TUNNISTAMO_ISSUER",
                "loa": "low",
                "sub": str(user.uuid),
            },
        }
    }


@pytest.mark.parametrize("dry_run", ["true", "True", "TRUE", "1", 1, True])
def test_delete_user_data__dont_anonymize_if_dryrun(api_client, settings, dry_run):
    user = UserFactory.create(username="foo")

    settings.GDPR_API_DELETE_SCOPE = "gdprdelete"
    auth_header = get_gdpr_auth_header(user, scopes=[settings.GDPR_API_DELETE_SCOPE])
    api_client.credentials(HTTP_AUTHORIZATION=auth_header)

    url = reverse("gdpr_v1", kwargs={"uuid": str(user.uuid)})
    with patch_oidc_config():
        response = api_client.delete(url, data={"dry_run": dry_run})

    assert response.status_code == 204, response.data
    user.refresh_from_db()
    assert user.username == "foo"
