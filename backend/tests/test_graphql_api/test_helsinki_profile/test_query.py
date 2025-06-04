from __future__ import annotations

from typing import TYPE_CHECKING, Any

import pytest

from tilavarauspalvelu.enums import LoginMethod
from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient
from tilavarauspalvelu.integrations.sentry import SentryLogger

from tests.factories import ApplicationFactory, ReservationFactory, UserFactory
from tests.factories.helsinki_profile import MyProfileDataFactory
from tests.helpers import ResponseMock, patch_method

from .helpers import profile_query

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import SessionMapping

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.request)
def test_helsinki_profile_data__query__all_fields(graphql):
    user = UserFactory.create_profile_user()
    application = ApplicationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic(
        verifiedPersonalInformation__nationalIdentificationNumber="181106A830T",
    )
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"profile": profile_data}})

    graphql.login_with_superuser()
    fields = """
        pk
        firstName
        lastName
        email
        phone
        birthday
        ssn
        streetAddress
        postalCode
        city
        countryCode
        additionalAddress
        municipalityCode
        municipalityName
        loginMethod
        isStrongLogin
    """
    query = profile_query(fields=fields, application_pk=application.pk)
    response = graphql(query)

    assert HelsinkiProfileClient.request.call_count == 1
    assert response.has_errors is False, response.errors

    assert response.first_query_object == {
        "pk": user.pk,
        "firstName": profile_data["verifiedPersonalInformation"]["firstName"],
        "lastName": profile_data["verifiedPersonalInformation"]["lastName"],
        "email": profile_data["primaryEmail"]["email"],
        "phone": profile_data["primaryPhone"]["phone"],
        "birthday": "2006-11-18",
        "ssn": profile_data["verifiedPersonalInformation"]["nationalIdentificationNumber"],
        "streetAddress": profile_data["verifiedPersonalInformation"]["permanentAddress"]["streetAddress"],
        "postalCode": profile_data["verifiedPersonalInformation"]["permanentAddress"]["postalCode"],
        "city": profile_data["verifiedPersonalInformation"]["permanentAddress"]["postOffice"],
        "countryCode": None,  # Only included in foreign country addresses
        "additionalAddress": None,  # Only included in foreign country addresses
        "municipalityCode": profile_data["verifiedPersonalInformation"]["municipalityOfResidenceNumber"],
        "municipalityName": profile_data["verifiedPersonalInformation"]["municipalityOfResidence"],
        "loginMethod": LoginMethod.PROFILE.value,
        "isStrongLogin": True,
    }


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.request)
def test_helsinki_profile_data__query__application_user(graphql):
    user = UserFactory.create_profile_user()
    application = ApplicationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"profile": profile_data}})

    graphql.login_with_superuser()
    query = profile_query(application_pk=application.pk)
    response = graphql(query)

    assert HelsinkiProfileClient.request.call_count == 1
    assert response.has_errors is False, response.errors

    assert response.first_query_object == {
        "firstName": profile_data["verifiedPersonalInformation"]["firstName"],
        "lastName": profile_data["verifiedPersonalInformation"]["lastName"],
    }


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.request)
def test_helsinki_profile_data__query__reservation_user(graphql):
    user = UserFactory.create_profile_user()
    reservation = ReservationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"profile": profile_data}})

    graphql.login_with_superuser()
    query = profile_query(reservation_pk=reservation.pk)
    response = graphql(query)

    assert HelsinkiProfileClient.request.call_count == 1
    assert response.has_errors is False, response.errors

    assert response.first_query_object == {
        "firstName": profile_data["verifiedPersonalInformation"]["firstName"],
        "lastName": profile_data["verifiedPersonalInformation"]["lastName"],
    }


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.request)
def test_helsinki_profile_data__query__ad_user(graphql):
    user = UserFactory.create_ad_user(profile_id="foo")
    application = ApplicationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"profile": profile_data}})

    graphql.login_with_superuser()
    fields = """
        pk
        firstName
        lastName
        email
        phone
        birthday
        ssn
        streetAddress
        postalCode
        city
        municipalityCode
        municipalityName
        loginMethod
        isStrongLogin
    """
    query = profile_query(fields=fields, application_pk=application.pk)
    response = graphql(query)

    assert HelsinkiProfileClient.request.call_count == 0
    assert response.has_errors is False, response.errors

    assert response.first_query_object == {
        "pk": user.pk,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "email": user.email,
        "phone": None,
        "birthday": user.date_of_birth.isoformat(),
        "ssn": None,
        "streetAddress": None,
        "postalCode": None,
        "city": None,
        "municipalityCode": None,
        "municipalityName": None,
        "loginMethod": LoginMethod.AD.value,
        "isStrongLogin": False,
    }


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.request)
def test_helsinki_profile_data__query__non_helauth_user(graphql):
    user = UserFactory.create(profile_id="foo")
    application = ApplicationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"profile": profile_data}})

    graphql.login_with_superuser()
    fields = """
        pk
        firstName
        lastName
        email
        phone
        birthday
        ssn
        streetAddress
        postalCode
        city
        municipalityCode
        municipalityName
        loginMethod
        isStrongLogin
    """
    query = profile_query(fields=fields, application_pk=application.pk)
    response = graphql(query)

    assert HelsinkiProfileClient.request.call_count == 0
    assert response.has_errors is False, response.errors

    assert response.first_query_object == {
        "pk": user.pk,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "email": user.email,
        "phone": None,
        "birthday": user.date_of_birth.isoformat(),
        "ssn": None,
        "streetAddress": None,
        "postalCode": None,
        "city": None,
        "municipalityCode": None,
        "municipalityName": None,
        "loginMethod": LoginMethod.OTHER.value,
        "isStrongLogin": False,
    }


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.request)
def test_helsinki_profile_data__query__no_profile_id(graphql):
    user = UserFactory.create_profile_user(profile_id="")
    application = ApplicationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"profile": profile_data}})

    graphql.login_with_superuser()
    query = profile_query(application_pk=application.pk)
    response = graphql(query)

    assert HelsinkiProfileClient.request.call_count == 0
    assert response.error_message() == "User does not have a profile id. Cannot fetch profile data."


@patch_method(HelsinkiProfileClient.get_token, return_value=None)
@patch_method(HelsinkiProfileClient.request)
def test_helsinki_profile_data__query__no_token(graphql):
    user = UserFactory.create_profile_user()
    application = ApplicationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"profile": profile_data}})

    graphql.login_with_superuser()
    query = profile_query(application_pk=application.pk)
    response = graphql(query)

    assert HelsinkiProfileClient.request.call_count == 0
    assert response.error_message() == "Helsinki profile token is not valid and could not be refreshed."


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.request)
@patch_method(SentryLogger.log_message)
def test_helsinki_profile_data__query__profile_request_has_errors(graphql):
    user = UserFactory.create_profile_user()
    application = ApplicationFactory.create(user=user)

    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"errors": [{"message": "foo"}]})

    graphql.login_with_superuser()
    query = profile_query(application_pk=application.pk)
    response = graphql(query)

    assert HelsinkiProfileClient.request.call_count == 1
    assert response.error_message() == 'Helsinki profile: Response contains errors. [{"message": "foo"}]'

    assert SentryLogger.log_message.call_count == 1


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.request)
def test_helsinki_profile_data__query__no_permission(graphql):
    user = UserFactory.create_profile_user()
    application = ApplicationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"profile": profile_data}})

    graphql.login_with_regular_user()
    query = profile_query(application_pk=application.pk)
    response = graphql(query)

    assert HelsinkiProfileClient.request.call_count == 0
    assert response.error_message() == "No permission to access node."


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.request)
def test_helsinki_profile_data__query__general_admin(graphql):
    user = UserFactory.create_profile_user()
    application = ApplicationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"profile": profile_data}})

    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    query = profile_query(application_pk=application.pk)
    response = graphql(query)

    assert HelsinkiProfileClient.request.call_count == 1
    assert response.has_errors is False, response.errors

    assert response.first_query_object == {
        "firstName": profile_data["verifiedPersonalInformation"]["firstName"],
        "lastName": profile_data["verifiedPersonalInformation"]["lastName"],
    }


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.request)
def test_helsinki_profile_data__query__unit_admin(graphql):
    user = UserFactory.create_profile_user()
    application = ApplicationFactory.create(
        user=user,
        application_sections__reservation_unit_options__reservation_unit__unit__name="foo",
    )
    unit = application.units_for_permissions[0]

    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"profile": profile_data}})

    admin = UserFactory.create_with_unit_role(units=[unit])
    graphql.force_login(admin)

    query = profile_query(application_pk=application.pk)
    response = graphql(query)

    assert HelsinkiProfileClient.request.call_count == 1
    assert response.has_errors is False, response.errors

    assert response.first_query_object == {
        "firstName": profile_data["verifiedPersonalInformation"]["firstName"],
        "lastName": profile_data["verifiedPersonalInformation"]["lastName"],
    }


def test_helsinki_profile_data__query__keycloak_token_expired(graphql):
    user = UserFactory.create_profile_user()
    application = ApplicationFactory.create(user=user)

    graphql.login_with_superuser()
    query = profile_query(application_pk=application.pk)

    def change_session(session: SessionMapping, **kwargs: Any) -> None:
        session["keycloak_refresh_token_expired"] = True

    with patch_method(HelsinkiProfileClient.get_user_profile_info, side_effect=change_session):
        response = graphql(query)

    assert response.error_message() == "Keycloak refresh token is expired. Please log out and back in again."
