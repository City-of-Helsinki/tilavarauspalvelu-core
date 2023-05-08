from typing import Dict, List
from unittest import mock
from unittest.mock import MagicMock, patch

from assertpy import assert_that
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from requests import Response

from applications.tests.factories import CityFactory
from users.utils.open_city_profile.basic_info_resolver import (
    ProfileNodeIdReader,
    ProfileReadError,
    ProfileUserInfoReader,
)


def get_email_nodes() -> List:
    return [
        {
            "node": {
                "email": "none@test.com",
                "emailType": "NONE",
            }
        },
        {
            "node": {
                "email": "other@test.com",
                "emailType": "OTHER",
            }
        },
        {
            "node": {
                "email": "work@email.com",
                "emailType": "WORK",
            }
        },
        {
            "node": {
                "email": "personal@test.com",
                "emailType": "PERSONAL",
            }
        },
    ]


def get_address_nodes() -> List:
    return [
        {
            "node": {
                "postalCode": "00100",
                "address": "Test street 4",
                "city": "Helsinki",
                "addressType": "NONE",
            }
        },
        {
            "node": {
                "postalCode": "00010",
                "address": "Test street 3",
                "city": "Helsinki",
                "addressType": "OTHER",
            }
        },
        {
            "node": {
                "addressType": "WORK",
                "postalCode": "123",
                "city": "Wrong city",
                "address": "Test street 2",
            }
        },
        {
            "node": {
                "postalCode": "00100",
                "address": "Test street 1",
                "city": "Helsinki",
                "addressType": "HOME",
            }
        },
    ]


def get_phone_nodes() -> List:
    return [
        {
            "node": {
                "phone": "6543",
                "phoneType": "NONE",
            }
        },
        {
            "node": {
                "phone": "432554",
                "phoneType": "OTHER",
            }
        },
        {
            "node": {
                "phone": "23454",
                "phoneType": "WORK",
            }
        },
        {
            "node": {
                "phone": "987654321",
                "phoneType": "HOME",
            }
        },
        {
            "node": {
                "phone": "123456789",
                "phoneType": "MOBILE",
            }
        },
    ]


def get_profile_gql_response(addresses=None, phones=None, emails=None) -> Dict:
    addresses = addresses if isinstance(addresses, list) else get_address_nodes()
    phones = phones if isinstance(phones, list) else get_phone_nodes()
    emails = emails if isinstance(emails, list) else get_email_nodes()
    return {
        "data": {
            "myProfile": {
                "firstName": "John",
                "lastName": "Doe",
                "primaryAddress": {
                    "postalCode": "00100",
                    "address": "Test street 1",
                    "city": "Helsinki",
                    "addressType": "HOME",
                },
                "addresses": {"edges": addresses},
                "primaryPhone": {
                    "phone": "123456789",
                },
                "phones": {"edges": phones},
                "primaryEmail": {
                    "email": "email@test.com",
                    "emailType": "PERSONAL",
                },
                "emails": {"edges": emails},
                "verifiedPersonalInformation": {
                    "municipalityOfResidence": "Helsinki",
                    "municipalityOfResidenceNumber": "091",
                    "permanentAddress": {
                        "postalCode": "00100",
                        "streetAddress": "Permanent street 1",
                        "postOffice": "Helsinki",
                    },
                    "permanentForeignAddress": {
                        "streetAddress": "Foreign street 1",
                        "additionalAddress": "Foreign city",
                        "countryCode": "AX",
                    },
                },
            }
        }
    }


class ProfileUserInfoReaderTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.request = MagicMock()
        cls.request.headers = {"X-Authorization": b"jwtokeny"}
        cls.user = get_user_model().objects.create(
            username="testy",
            first_name="tes",
            last_name="ty",
            email="test.y@foo.com",
        )
        with patch(
            "requests.get",
            return_value=MagicMock(
                status_code=200, json=MagicMock(return_value=get_profile_gql_response())
            ),
        ):
            cls.reader = ProfileUserInfoReader(cls.user, cls.request)

    @classmethod
    def __get_profile_gql_with_errors(cls):
        return {"errors": [{"message": "Bad bad error"}]}

    def test_get_first_name(self):
        assert_that(self.reader.get_first_name()).is_equal_to("John")

    def test_get_last_name(self):
        assert_that(self.reader.get_last_name()).is_equal_to("Doe")

    def test_get_address_defaults_to_primary(self):
        address = self.reader.get_address()

        assert_that(address.get("address")).is_equal_to("Test street 1")
        assert_that(address.get("postalCode")).is_equal_to("00100")
        assert_that(address.get("city")).is_equal_to("Helsinki")

    @patch("requests.get")
    def test_get_address_if_no_primary_respects_priority_order(self, mock_get):
        ret_val = MagicMock(status_code=200, json=MagicMock())
        mock_get.return_value = ret_val

        gql_response = get_profile_gql_response()
        gql_response["data"]["myProfile"]["primaryAddress"] = None
        ret_val.json.return_value = gql_response

        reader = ProfileUserInfoReader(self.user, self.request)
        address = reader.get_address()

        assert_that(address.get("address")).is_equal_to("Test street 1")

        addresses = get_address_nodes()
        type_priorities = {"Test street 2": 3, "Test street 3": 2, "Test street 4": 1}
        for expected_address, pop_index in type_priorities.items():
            addresses.pop(pop_index)
            gql_response = get_profile_gql_response(addresses=addresses)
            gql_response["data"]["myProfile"]["primaryAddress"] = None
            ret_val.json.return_value = gql_response
            mock_get.return_value = ret_val
            reader = ProfileUserInfoReader(self.user, self.request)
            address = reader.get_address()

            assert_that(address.get("address")).is_equal_to(expected_address)

    @patch("requests.get")
    def test_get_address_no_primary_and_addresses_defaults_to_permanent_address(
        self, mock_get
    ):
        gql_response = get_profile_gql_response(addresses=[])
        gql_response["data"]["myProfile"]["primaryAddress"] = None
        gql_response["data"]["myProfile"]["addresses"] = {"edges": []}
        ret_val = MagicMock(status_code=200, json=MagicMock(return_value=gql_response))
        mock_get.return_value = ret_val
        reader = ProfileUserInfoReader(self.user, self.request)

        address = reader.get_address()

        assert_that(address.get("address")).is_equal_to("Permanent street 1")
        assert_that(address.get("postalCode")).is_equal_to("00100")
        assert_that(address.get("city")).is_equal_to("Helsinki")

    @patch("requests.get")
    def test_get_address_no_primary_and_addresses_nor_permanent_defaults_to_permanent_foreign_address(
        self, mock_get
    ):
        gql_response = get_profile_gql_response(addresses=[])
        gql_response["data"]["myProfile"]["primaryAddress"] = None
        gql_response["data"]["myProfile"]["addresses"] = {"edges": []}
        gql_response["data"]["myProfile"]["verifiedPersonalInformation"][
            "permanentAddress"
        ] = None
        ret_val = MagicMock(status_code=200, json=MagicMock(return_value=gql_response))
        mock_get.return_value = ret_val
        reader = ProfileUserInfoReader(self.user, self.request)

        address = reader.get_address()

        assert_that(address.get("address")).is_equal_to("Foreign street 1")
        assert_that(address.get("postalCode")).is_none()
        assert_that(address.get("city")).is_none()
        assert_that(address.get("countryCode")).is_equal_to("AX")

    @patch("requests.get")
    def test_get_address_no_primary_and_addresses_nor_permanent_nor_permanent_foreign_address(
        self, mock_get
    ):
        gql_response = get_profile_gql_response(addresses=[])
        gql_response["data"]["myProfile"]["primaryAddress"] = None
        gql_response["data"]["myProfile"]["addresses"] = {"edges": []}
        gql_response["data"]["myProfile"]["verifiedPersonalInformation"][
            "permanentAddress"
        ] = None
        gql_response["data"]["myProfile"]["verifiedPersonalInformation"][
            "permanentForeignAddress"
        ] = None
        ret_val = MagicMock(status_code=200, json=MagicMock(return_value=gql_response))
        mock_get.return_value = ret_val
        reader = ProfileUserInfoReader(self.user, self.request)

        address = reader.get_address()

        assert_that(address).is_none()

    def test_get_phone_defaults_to_primary(self):
        assert_that(self.reader.get_phone()).is_equal_to("123456789")

    @patch("requests.get")
    def test_get_phone_if_no_primary_respects_priority_order(self, mock_get):
        ret_val = MagicMock(status_code=200, json=MagicMock())
        mock_get.return_value = ret_val

        gql_response = get_profile_gql_response()
        gql_response["data"]["myProfile"]["primaryPhone"] = None
        ret_val.json.return_value = gql_response

        reader = ProfileUserInfoReader(self.user, self.request)
        assert_that(reader.get_phone()).is_equal_to("123456789")

        phones = get_phone_nodes()
        type_priorities = {"987654321": 4, "23454": 3, "432554": 2, "6543": 1}
        for expected_phone, pop_index in type_priorities.items():
            phones.pop(pop_index)
            gql_response = get_profile_gql_response(phones=phones)
            gql_response["data"]["myProfile"]["primaryPhone"] = None
            ret_val.json.return_value = gql_response
            mock_get.return_value = ret_val
            reader = ProfileUserInfoReader(self.user, self.request)

            assert_that(reader.get_phone()).is_equal_to(expected_phone)

    def test_get_email_defaults_to_primary(self):
        assert_that(self.reader.get_email()).is_equal_to("email@test.com")

    @patch("requests.get")
    def test_get_email_if_no_primary_respects_priority_order(self, mock_get):
        ret_val = MagicMock(status_code=200, json=MagicMock())
        mock_get.return_value = ret_val

        gql_response = get_profile_gql_response()
        gql_response["data"]["myProfile"]["primaryEmail"] = None
        ret_val.json.return_value = gql_response

        reader = ProfileUserInfoReader(self.user, self.request)
        assert_that(reader.get_email()).is_equal_to("personal@test.com")

        emails = get_email_nodes()
        type_priorities = {"work@email.com": 3, "other@test.com": 2, "none@test.com": 1}
        for expected_email, pop_index in type_priorities.items():
            emails.pop(pop_index)
            gql_response = get_profile_gql_response(emails=emails)
            gql_response["data"]["myProfile"]["primaryEmail"] = None
            ret_val.json.return_value = gql_response
            mock_get.return_value = ret_val
            reader = ProfileUserInfoReader(self.user, self.request)

            assert_that(reader.get_email()).is_equal_to(expected_email)

    def test_get_user_home_city_matching_municipality_number(self):
        city = CityFactory(municipality_code=settings.PRIMARY_MUNICIPALITY_NUMBER)

        assert_that(self.reader.get_user_home_city()).is_equal_to(city)

    def test_get_user_home_city_matching_municipality_name(self):
        city = CityFactory(name=settings.PRIMARY_MUNICIPALITY_NAME)

        assert_that(self.reader.get_user_home_city()).is_equal_to(city)

    def test_get_user_home_city_gets_secondary_city_when_no_match(self):
        city = CityFactory(name="Other")

        assert_that(self.reader.get_user_home_city()).is_equal_to(city)

    def test_get_user_home_city_returns_none_if_no_match_for_secondary(self):
        CityFactory(name="Nu York")
        assert_that(self.reader.get_user_home_city()).is_none()

    @patch("requests.get")
    def test_cannot_parse_json_raises(self, mock_get):
        ret_val = Response()
        ret_val.status_code = 400
        mock_get.return_value = ret_val

        with self.assertRaises(ProfileReadError):
            ProfileUserInfoReader(self.user, self.request)

    @patch("requests.get")
    def test_getting_500_from_profile_raises(self, mock_get):
        ret_val = Response()
        ret_val.status_code = 500
        mock_get.return_value = ret_val

        with self.assertRaises(ProfileReadError):
            ProfileUserInfoReader(self.user, self.request)


response_mock = mock.MagicMock()


@mock.patch("requests.get", return_value=response_mock)
class ProfileNodeIdReaderTestCase(TestCase):
    @classmethod
    def __get_profile_gql_response(self, century_code="-"):
        return {
            "data": {
                "myProfile": {
                    "id": "aaa-bbb-ccc",
                }
            }
        }

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        response_mock.status_code = 200
        response_mock.json.return_value = cls.__get_profile_gql_response()
        cls.request = mock.MagicMock()
        cls.request.headers = {"X-Authorization": b"jwtokeny"}
        cls.reader = ProfileNodeIdReader(cls.request)

    def test_get_profile_id(self, gql_mock):
        response_mock.json.return_value = self.__get_profile_gql_response()
        assert_that(self.reader.get_user_profile_id()).is_equal_to("aaa-bbb-ccc")

    def test_profile_id_none_when_no_data(self, gql_mock):
        response_mock.json.return_value = {}
        assert_that(self.reader.get_user_profile_id()).is_none()

    def test_gql_response_has_errors_raises(self, gql_mock):
        response_mock.json.return_value = {"errors": [{"message": "Error!"}]}

        with self.assertRaises(ProfileReadError):
            self.reader.get_user_profile_id()

    def test_cannot_parse_json_raises(self, gql_mock):
        ret_val = Response()
        ret_val.status_code = 400
        gql_mock.return_value = ret_val

        with self.assertRaises(ProfileReadError):
            self.reader.get_user_profile_id()

    def test_getting_500_from_profile_raises(self, gql_mock):
        ret_val = Response()
        ret_val.status_code = 500
        gql_mock.return_value = ret_val

        with self.assertRaises(ProfileReadError):
            self.reader.get_user_profile_id()
