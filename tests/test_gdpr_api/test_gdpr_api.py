import datetime
import uuid
from typing import TYPE_CHECKING

import pytest
from dateutil.relativedelta import relativedelta
from django.urls import reverse
from django.utils import timezone
from rest_framework.exceptions import ErrorDetail

from merchants.enums import OrderStatus
from reservations.enums import ReservationStateChoice
from tests.factories import ApplicationFactory, PaymentOrderFactory, ReservationFactory, UserFactory
from tests.helpers import patch_method
from utils.sentry import SentryLogger

from .helpers import get_gdpr_auth_header, patch_oidc_config

if TYPE_CHECKING:
    from applications.models import Application, ApplicationSection
    from reservations.models import Reservation
    from users.models import User


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
    user: User = UserFactory.create()
    application: Application = ApplicationFactory.create_in_status_in_allocation(user=user)
    section: ApplicationSection = application.application_sections.first()
    reservation: Reservation = ReservationFactory.create(user=user)

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
                                "key": "BEGIN",
                                "value": reservation.begin,
                            },
                            {
                                "key": "END",
                                "value": reservation.end,
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
                                "key": "RESERVEE_ADDRESS_CITY",
                                "value": reservation.reservee_address_city,
                            },
                            {
                                "key": "RESERVEE_ADDRESS_STREET",
                                "value": reservation.reservee_address_street,
                            },
                            {
                                "key": "BILLING_FIRST_NAME",
                                "value": reservation.billing_first_name,
                            },
                            {
                                "key": "BILLING_LAST_NAME",
                                "value": reservation.billing_last_name,
                            },
                            {
                                "key": "BILLING_EMAIL",
                                "value": reservation.billing_email,
                            },
                            {
                                "key": "BILLING_PHONE",
                                "value": reservation.billing_phone,
                            },
                            {
                                "key": "BILLING_ADDRESS_ZIP",
                                "value": reservation.billing_address_zip,
                            },
                            {
                                "key": "BILLING_ADDRESS_CITY",
                                "value": reservation.billing_address_city,
                            },
                            {
                                "key": "BILLING_ADDRESS_STREET",
                                "value": reservation.billing_address_street,
                            },
                            {
                                "key": "RESERVEE_ID",
                                "value": reservation.reservee_id,
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
                            {
                                "key": "PERSON",
                                "children": [
                                    {
                                        "key": "FIRST_NAME",
                                        "value": application.contact_person.first_name,
                                    },
                                    {
                                        "key": "LAST_NAME",
                                        "value": application.contact_person.last_name,
                                    },
                                    {
                                        "key": "EMAIL",
                                        "value": application.contact_person.email,
                                    },
                                    {
                                        "key": "PHONE_NUMBER",
                                        "value": application.contact_person.phone_number,
                                    },
                                ],
                            },
                            {
                                "key": "ORGANISATION",
                                "children": [
                                    {
                                        "key": "NAME",
                                        "value": application.organisation.name,
                                    },
                                    {
                                        "key": "IDENTIFIER",
                                        "value": application.organisation.identifier,
                                    },
                                    {
                                        "key": "EMAIL",
                                        "value": application.organisation.email,
                                    },
                                    {
                                        "key": "CORE_BUSINESS",
                                        "value": application.organisation.core_business,
                                    },
                                    {
                                        "key": "CORE_BUSINESS_FI",
                                        "value": application.organisation.core_business_fi,
                                    },
                                    {
                                        "key": "CORE_BUSINESS_EN",
                                        "value": application.organisation.core_business_en,
                                    },
                                    {
                                        "key": "CORE_BUSINESS_SV",
                                        "value": application.organisation.core_business_sv,
                                    },
                                    {
                                        "key": "ADDRESS",
                                        "children": [
                                            {
                                                "key": "POST_CODE",
                                                "value": application.organisation.address.post_code,
                                            },
                                            {
                                                "key": "STREET_ADDRESS",
                                                "value": application.organisation.address.street_address,
                                            },
                                            {
                                                "key": "STREET_ADDRESS_FI",
                                                "value": application.organisation.address.street_address_fi,
                                            },
                                            {
                                                "key": "STREET_ADDRESS_EN",
                                                "value": application.organisation.address.street_address_en,
                                            },
                                            {
                                                "key": "STREET_ADDRESS_SV",
                                                "value": application.organisation.address.street_address_sv,
                                            },
                                            {
                                                "key": "CITY",
                                                "value": application.organisation.address.city,
                                            },
                                            {
                                                "key": "CITY_FI",
                                                "value": application.organisation.address.city_fi,
                                            },
                                            {
                                                "key": "CITY_EN",
                                                "value": application.organisation.address.city_en,
                                            },
                                            {
                                                "key": "CITY_SV",
                                                "value": application.organisation.address.city_sv,
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                "key": "ADDRESS",
                                "children": [
                                    {
                                        "key": "POST_CODE",
                                        "value": application.billing_address.post_code,
                                    },
                                    {
                                        "key": "STREET_ADDRESS",
                                        "value": application.billing_address.street_address,
                                    },
                                    {
                                        "key": "STREET_ADDRESS_FI",
                                        "value": application.billing_address.street_address_fi,
                                    },
                                    {
                                        "key": "STREET_ADDRESS_EN",
                                        "value": application.billing_address.street_address_en,
                                    },
                                    {
                                        "key": "STREET_ADDRESS_SV",
                                        "value": application.billing_address.street_address_sv,
                                    },
                                    {
                                        "key": "CITY",
                                        "value": application.billing_address.city,
                                    },
                                    {
                                        "key": "CITY_FI",
                                        "value": application.billing_address.city_fi,
                                    },
                                    {
                                        "key": "CITY_EN",
                                        "value": application.billing_address.city_en,
                                    },
                                    {
                                        "key": "CITY_SV",
                                        "value": application.billing_address.city_sv,
                                    },
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
            "request_api_scopes": ["invalid"],
            "request_loa": "high",
            "allowed_loa": ["substantial", "high"],
            "required_query_scope": "gdprquery",
            "required_delete_scope": "gdprdelete",
        }
    }


@patch_method(SentryLogger.log_message)
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
            "request_api_scopes": ["gdprquery"],
            "request_loa": "low",
            "allowed_loa": ["substantial", "high"],
            "required_query_scope": "gdprquery",
            "required_delete_scope": "gdprdelete",
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
    reservation = ReservationFactory.create(user=user)
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
    begin = timezone.now()
    end = begin + datetime.timedelta(hours=2)
    ReservationFactory.create(user=user, begin=begin, end=end, state=ReservationStateChoice.CREATED)

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
    begin = timezone.now() - relativedelta(months=1)
    end = begin + datetime.timedelta(hours=2)
    ReservationFactory.create(user=user, begin=begin, end=end, state=ReservationStateChoice.CONFIRMED)

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
            "request_api_scopes": ["invalid"],
            "request_loa": "high",
            "allowed_loa": ["substantial", "high"],
            "required_query_scope": "gdprquery",
            "required_delete_scope": "gdprdelete",
        }
    }


@patch_method(SentryLogger.log_message)
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
            "request_api_scopes": ["gdprdelete"],
            "request_loa": "low",
            "allowed_loa": ["substantial", "high"],
            "required_query_scope": "gdprquery",
            "required_delete_scope": "gdprdelete",
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
