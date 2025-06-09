from __future__ import annotations

import re
from typing import NamedTuple
from unittest.mock import MagicMock

import pytest
from graphene_django_extensions.testing import parametrize_helper

from tilavarauspalvelu.enums import MunicipalityChoice
from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient
from tilavarauspalvelu.integrations.sentry import SentryLogger
from utils.external_service.errors import (
    ExternalServiceError,
    ExternalServiceParseJSONError,
    ExternalServiceRequestError,
)

from tests.factories import UserFactory
from tests.factories.helsinki_profile import (
    MyProfileDataFactory,
    ProfileAddressFactory,
    ProfileEmailFactory,
    ProfilePhoneFactory,
)
from tests.helpers import ResponseMock, patch_method

pytestmark = [
    pytest.mark.django_db,
]


class Params(NamedTuple):
    types: list[str]
    select: int


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__all_primary():
    profile_data = MyProfileDataFactory.create_basic()
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info == {
        "reservee_first_name": "Example",
        "reservee_last_name": "User",
        "reservee_email": "user@example.com",
        "reservee_phone": "0123456789",
        "reservee_address_street": "Example street 1",
        "reservee_address_zip": "00100",
        "reservee_address_city": "Helsinki",
        "municipality": MunicipalityChoice.HELSINKI.value,
    }


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
@pytest.mark.parametrize(
    **parametrize_helper({
        "HOME address": Params(
            types=["NONE", "OTHER", "WORK", "HOME"],
            select=-1,
        ),
        "WORK address": Params(
            types=["NONE", "OTHER", "WORK"],
            select=-1,
        ),
        "OTHER address": Params(
            types=["NONE", "OTHER"],
            select=-1,
        ),
        "NONE address": Params(
            types=["NONE"],
            select=-1,
        ),
        "highest priority address not last": Params(
            types=["NONE", "HOME", "OTHER", "WORK"],
            select=1,
        ),
    })
)
def test_helsinki_profile_client__prefill_info__highest_priority_address(types, select):
    addresses = [ProfileAddressFactory.create(addressType=type_) for type_ in types]

    profile_data = MyProfileDataFactory.create_basic(primaryAddress=None, addresses=addresses)
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["reservee_address_street"] == addresses[select]["address"]
    assert prefill_info["reservee_address_zip"] == addresses[select]["postalCode"]
    assert prefill_info["reservee_address_city"] == addresses[select]["city"]


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__permanent_address():
    profile_data = MyProfileDataFactory.create_basic(
        primaryAddress=None,
        addresses=[],
        verifiedPersonalInformation__permanentAddress__streetAddress="Permanent street 1",
        verifiedPersonalInformation__permanentAddress__postalCode="00100",
        verifiedPersonalInformation__permanentAddress__postOffice="Helsinki",
    )
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["reservee_address_street"] == "Permanent street 1"
    assert prefill_info["reservee_address_zip"] == "00100"
    assert prefill_info["reservee_address_city"] == "Helsinki"


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__permanent_foreign_address():
    profile_data = MyProfileDataFactory.create_basic(
        primaryAddress=None,
        addresses=[],
        verifiedPersonalInformation__permanentAddress=None,
        verifiedPersonalInformation__permanentForeignAddress__streetAddress="Foreign street 1",
    )
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["reservee_address_street"] == "Foreign street 1"
    assert prefill_info["reservee_address_zip"] is None
    assert prefill_info["reservee_address_city"] is None


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__no_address():
    profile_data = MyProfileDataFactory.create_basic(
        primaryAddress=None,
        addresses=[],
        verifiedPersonalInformation__permanentAddress=None,
        verifiedPersonalInformation__permanentForeignAddress=None,
    )
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["reservee_address_street"] is None
    assert prefill_info["reservee_address_zip"] is None
    assert prefill_info["reservee_address_city"] is None


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
@pytest.mark.parametrize(
    **parametrize_helper({
        "MOBILE phone": Params(
            types=["NONE", "OTHER", "WORK", "HOME", "MOBILE"],
            select=-1,
        ),
        "HOME phone": Params(
            types=["NONE", "OTHER", "WORK", "HOME"],
            select=-1,
        ),
        "WORK phone": Params(
            types=["NONE", "OTHER", "WORK"],
            select=-1,
        ),
        "OTHER phone": Params(
            types=["NONE", "OTHER"],
            select=-1,
        ),
        "NONE phone": Params(
            types=["NONE"],
            select=-1,
        ),
        "highest priority phone not last": Params(
            types=["NONE", "OTHER", "MOBILE", "WORK", "HOME"],
            select=2,
        ),
    })
)
def test_helsinki_profile_client__prefill_info__highest_priority_phone(types, select):
    phones = [ProfilePhoneFactory.create(phoneType=type_) for type_ in types]

    profile_data = MyProfileDataFactory.create_basic(primaryPhone=None, phones=phones)
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["reservee_phone"] == phones[select]["phone"]


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__no_phone():
    profile_data = MyProfileDataFactory.create_basic(primaryPhone=None, phones=[])
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["reservee_phone"] is None


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
@pytest.mark.parametrize(
    **parametrize_helper({
        "PERSONAL address": Params(
            types=["NONE", "OTHER", "WORK", "PERSONAL"],
            select=-1,
        ),
        "WORK address": Params(
            types=["NONE", "OTHER", "WORK"],
            select=-1,
        ),
        "OTHER address": Params(
            types=["NONE", "OTHER"],
            select=-1,
        ),
        "NONE address": Params(
            types=["NONE"],
            select=-1,
        ),
        "highest priority email not last": Params(
            types=["NONE", "PERSONAL", "OTHER", "WORK"],
            select=1,
        ),
    })
)
def test_helsinki_profile_client__prefill_info__highest_priority_email(types, select):
    emails = [ProfileEmailFactory.create(emailType=type_) for type_ in types]

    profile_data = MyProfileDataFactory.create_basic(primaryEmail=None, emails=emails)
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["reservee_email"] == emails[select]["email"]


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__no_email():
    profile_data = MyProfileDataFactory.create_basic(primaryEmail=None, emails=[])
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["reservee_email"] is None


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__municipality_matching_municipality_number():
    profile_data = MyProfileDataFactory.create_basic(
        verifiedPersonalInformation__municipalityOfResidenceNumber=MunicipalityChoice.HELSINKI.code,
    )
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["municipality"] == MunicipalityChoice.HELSINKI.value


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__municipality_matching_municipality_name():
    profile_data = MyProfileDataFactory.create_basic(
        verifiedPersonalInformation__municipalityOfResidence=MunicipalityChoice.HELSINKI.value,
    )
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["municipality"] == MunicipalityChoice.HELSINKI.value


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__secondary_city():
    profile_data = MyProfileDataFactory.create_basic(
        verifiedPersonalInformation__municipalityOfResidence="foo",
        verifiedPersonalInformation__municipalityOfResidenceNumber="bar",
    )
    HelsinkiProfileClient.request.return_value = ResponseMock(json_data={"data": {"myProfile": profile_data}})

    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert prefill_info["municipality"] == MunicipalityChoice.OTHER.value


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
@patch_method(SentryLogger.log_message)
def test_helsinki_profile_client__prefill_info__non_200_response():
    response = MagicMock()
    response.status_code = 400
    response.request = MagicMock()
    response.request.method = "get"
    response.url = "example.com"

    HelsinkiProfileClient.request.return_value = response

    user = UserFactory.create()

    msg = "GET request to HELSINKI PROFILE (example.com) failed with status 400."
    with pytest.raises(ExternalServiceRequestError, match=re.escape(msg)):
        HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert SentryLogger.log_message.call_count == 1


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
@patch_method(SentryLogger.log_message)
def test_helsinki_profile_client__prefill_info__contains_errors():
    profile_data = MyProfileDataFactory.create_basic()

    HelsinkiProfileClient.request.return_value = ResponseMock(
        json_data={
            "data": {"myProfile": profile_data},
            "errors": [{"message": "foo"}],
        }
    )

    user = UserFactory.create()

    msg = 'Helsinki profile: Response contains errors. [{"message": "foo"}]'
    with pytest.raises(ExternalServiceError, match=re.escape(msg)):
        HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert SentryLogger.log_message.call_count == 1


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
def test_helsinki_profile_client__prefill_info__json_decode_error():
    response = MagicMock()
    response.status_code = 200
    response.json.side_effect = ValueError("foo")

    HelsinkiProfileClient.request.return_value = response

    user = UserFactory.create()

    msg = "Parsing Helsinki Profile return data failed."
    with pytest.raises(ExternalServiceParseJSONError, match=re.escape(msg)):
        HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})


@patch_method(HelsinkiProfileClient.request)
@patch_method(HelsinkiProfileClient.get_token, return_value="foo")
@patch_method(SentryLogger.log_message)
def test_helsinki_profile_client__prefill_info__500_error():
    response = MagicMock()
    response.status_code = 500
    response.request = MagicMock()
    response.request.method = "get"
    response.url = "example.com"

    HelsinkiProfileClient.request.return_value = response

    user = UserFactory.create()

    msg = "GET request to HELSINKI PROFILE (example.com) failed with status 500."
    with pytest.raises(ExternalServiceRequestError, match=re.escape(msg)):
        HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})

    assert SentryLogger.log_message.call_count == 1


@patch_method(HelsinkiProfileClient.get_token, return_value=None)
def test_helsinki_profile_client__prefill_info__no_token():
    user = UserFactory.create()
    prefill_info = HelsinkiProfileClient.get_reservation_prefill_info(user=user, session={})
    assert prefill_info is None
