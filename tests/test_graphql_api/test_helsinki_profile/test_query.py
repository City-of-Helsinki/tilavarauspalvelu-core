import pytest

from tests.factories import ApplicationFactory, ReservationFactory, UserFactory
from tests.factories.helsinki_profile import MyProfileDataFactory
from tests.helpers import ResponseMock, patch_method
from users.helauth.clients import HelsinkiProfileClient
from users.helauth.typing import ADLoginAMR, LoginMethod, ProfileLoginAMR

from .helpers import profile_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.generic)
def test_helsinki_profile_data__query__all_fields(graphql):
    user = UserFactory.create(profile_id="foo", social_auth__extra_data__amr=ProfileLoginAMR.SUOMI_FI.value)
    application = ApplicationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic(
        verifiedPersonalInformation__nationalIdentificationNumber="181106A830T",
    )
    HelsinkiProfileClient.generic.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    graphql.login_with_superuser()
    fields = """
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
    query = profile_query(fields=fields, application_id=application.id)
    response = graphql(query)

    assert HelsinkiProfileClient.generic.call_count == 1
    assert response.has_errors is False, response.errors

    assert response.first_query_object == {
        "firstName": profile_data["firstName"],
        "lastName": profile_data["lastName"],
        "email": profile_data["primaryEmail"]["email"],
        "phone": profile_data["primaryPhone"]["phone"],
        "birthday": "2006-11-18",
        "ssn": profile_data["verifiedPersonalInformation"]["nationalIdentificationNumber"],
        "streetAddress": profile_data["primaryAddress"]["address"],
        "postalCode": profile_data["primaryAddress"]["postalCode"],
        "city": profile_data["primaryAddress"]["city"],
        "municipalityCode": profile_data["verifiedPersonalInformation"]["municipalityOfResidenceNumber"],
        "municipalityName": profile_data["verifiedPersonalInformation"]["municipalityOfResidence"],
        "loginMethod": LoginMethod.PROFILE.value,
        "isStrongLogin": True,
    }


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.generic)
def test_helsinki_profile_data__query__application_user(graphql):
    user = UserFactory.create(profile_id="foo", social_auth__extra_data__amr=ProfileLoginAMR.SUOMI_FI.value)
    application = ApplicationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.generic.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    graphql.login_with_superuser()
    query = profile_query(application_id=application.id)
    response = graphql(query)

    assert HelsinkiProfileClient.generic.call_count == 1
    assert response.has_errors is False, response.errors

    assert response.first_query_object == {
        "firstName": profile_data["firstName"],
        "lastName": profile_data["lastName"],
    }


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.generic)
def test_helsinki_profile_data__query__reservation_user(graphql):
    user = UserFactory.create(profile_id="foo", social_auth__extra_data__amr=ProfileLoginAMR.SUOMI_FI.value)
    reservation = ReservationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.generic.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    graphql.login_with_superuser()
    query = profile_query(reservation_id=reservation.id)
    response = graphql(query)

    assert HelsinkiProfileClient.generic.call_count == 1
    assert response.has_errors is False, response.errors

    assert response.first_query_object == {
        "firstName": profile_data["firstName"],
        "lastName": profile_data["lastName"],
    }


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.generic)
def test_helsinki_profile_data__query__ad_user(graphql):
    user = UserFactory.create(profile_id="foo", social_auth__extra_data__amr=ADLoginAMR.HELSINKIAD.value)
    application = ApplicationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.generic.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    graphql.login_with_superuser()
    fields = """
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
    query = profile_query(fields=fields, application_id=application.id)
    response = graphql(query)

    assert HelsinkiProfileClient.generic.call_count == 0
    assert response.has_errors is False, response.errors

    assert response.first_query_object == {
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
@patch_method(HelsinkiProfileClient.generic)
def test_helsinki_profile_data__query__non_helauth_user(graphql):
    user = UserFactory.create(profile_id="foo")
    application = ApplicationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.generic.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    graphql.login_with_superuser()
    fields = """
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
    query = profile_query(fields=fields, application_id=application.id)
    response = graphql(query)

    assert HelsinkiProfileClient.generic.call_count == 0
    assert response.has_errors is False, response.errors

    assert response.first_query_object == {
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
@patch_method(HelsinkiProfileClient.generic)
def test_helsinki_profile_data__query__no_profile_id(graphql):
    user = UserFactory.create(profile_id="", social_auth__extra_data__amr=ProfileLoginAMR.SUOMI_FI.value)
    application = ApplicationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.generic.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    graphql.login_with_superuser()
    query = profile_query(application_id=application.id)
    response = graphql(query)

    assert HelsinkiProfileClient.generic.call_count == 0
    assert response.error_message() == "User does not have a profile id. Cannot fetch profile data."


@patch_method(HelsinkiProfileClient.get_token, return_value=None)
@patch_method(HelsinkiProfileClient.generic)
def test_helsinki_profile_data__query__no_token(graphql):
    user = UserFactory.create(profile_id="foo", social_auth__extra_data__amr=ProfileLoginAMR.SUOMI_FI.value)
    application = ApplicationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.generic.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    graphql.login_with_superuser()
    query = profile_query(application_id=application.id)
    response = graphql(query)

    assert HelsinkiProfileClient.generic.call_count == 0
    assert response.error_message() == "Helsinki profile token is not valid and could not be refreshed."


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.generic)
def test_helsinki_profile_data__query__profile_request_has_errors(graphql):
    user = UserFactory.create(profile_id="foo", social_auth__extra_data__amr=ProfileLoginAMR.SUOMI_FI.value)
    application = ApplicationFactory.create(user=user)

    HelsinkiProfileClient.generic.return_value = ResponseMock(json_data={"errors": [{"message": "foo"}]})

    graphql.login_with_superuser()
    query = profile_query(application_id=application.id)
    response = graphql(query)

    assert HelsinkiProfileClient.generic.call_count == 1
    assert response.error_message() == 'Helsinki profile: Response contains errors. [{"message": "foo"}]'


@patch_method(HelsinkiProfileClient.get_token, return_value="token")
@patch_method(HelsinkiProfileClient.generic)
def test_helsinki_profile_data__query__no_permission(graphql):
    user = UserFactory.create(profile_id="foo", social_auth__extra_data__amr=ProfileLoginAMR.SUOMI_FI.value)
    application = ApplicationFactory.create(user=user)

    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.generic.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    graphql.login_with_regular_user()
    query = profile_query(application_id=application.id)
    response = graphql(query)

    assert HelsinkiProfileClient.generic.call_count == 0
    assert response.error_message() == "No permission to access node."
