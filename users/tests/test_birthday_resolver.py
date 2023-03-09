import datetime
from unittest import mock

from assertpy import assert_that
from django.test import TestCase

from users.utils.open_city_profile.birthday_resolver import (
    BirthDayReaderQueryError,
    BirthDayReaderTokenNullOrEmptyError,
    UserBirthdayReader,
)

response_mock = mock.MagicMock()


@mock.patch("requests.get", return_value=response_mock)
class BirthdayResolverGetUserBirthDayTestCase(TestCase):
    @classmethod
    def setUpTestData(cls):
        response_mock.status_code = 200
        response_mock.json.return_value = cls.__get_profile_gql_response()
        cls.request = mock.MagicMock()
        cls.request.headers = {"X-Authorization": b"jwtokeny"}

        cls.reader = UserBirthdayReader(cls.request)

    @classmethod
    def __get_profile_gql_response(self, century_code="-"):
        return {
            "data": {
                "myProfile": {
                    "id": "aaa-bbb-ccc",
                    "verifiedPersonalInformation": {
                        "nationalIdentificationNumber": f"120345{century_code}6789"
                    },
                }
            }
        }

    @classmethod
    def __get_profile_gql_with_errors(cls):
        return {"errors": [{"message": "Bad bad error"}]}

    def test_getting_birthday_success_20th_century(self, gql_mock):
        the_birth_day = datetime.date(1945, 3, 12)
        for century in ["-", "Y", "X", "W", "V", "U"]:
            response_mock.json.return_value = self.__get_profile_gql_response(
                century_code=century
            )

            assert_that(self.reader.get_user_birthday()).is_equal_to(the_birth_day)

    def test_getting_birthday_success_21th_century(self, gql_mock):
        the_birth_day = datetime.date(2045, 3, 12)
        for century in ["A", "B", "C", "D", "E", "F"]:
            response_mock.json.return_value = self.__get_profile_gql_response(
                century_code=century
            )

            assert_that(self.reader.get_user_birthday()).is_equal_to(the_birth_day)

    def test_raises_when_missing_x_auth_header(self, gql_mock):
        request = mock.MagicMock()
        request.headers = {}
        reader = UserBirthdayReader(request)

        with self.assertRaises(BirthDayReaderTokenNullOrEmptyError):
            reader.get_user_birthday()

    def test_errors_on_graph_response_errors_raises(self, gql_mock):
        response_mock.json.return_value = self.__get_profile_gql_with_errors()
        with self.assertRaises(BirthDayReaderQueryError):
            self.reader.get_user_birthday()

    def test_is_none_when_century_invalid(self, gql_mock):
        response_mock.json.return_value = self.__get_profile_gql_response(
            century_code="K"
        )

        assert_that(self.reader.get_user_birthday()).is_none()

    def test_is_none_when_national_identification_number_is_none(self, gql_mock):
        response_mock.json.return_value = {
            "data": {
                "myProfile": {
                    "verifiedPersonalInformation": {
                        "nationalIdentificationNumber": None
                    }
                }
            }
        }

        assert_that(self.reader.get_user_birthday()).is_none()

    def test_is_none_when_national_identification_number_is_wrong_length(
        self, gql_mock
    ):
        response_mock.json.return_value = {
            "data": {
                "myProfile": {
                    "verifiedPersonalInformation": {
                        "nationalIdentificationNumber": "1234"
                    }
                }
            }
        }

        assert_that(self.reader.get_user_birthday()).is_none()

    def test_is_none_when_no_verified_personal_info(self, gql_mock):
        response_mock.json.return_value = {
            "data": {"myProfile": {"verifiedPersonalInformation": None}}
        }

        assert_that(self.reader.get_user_birthday()).is_none()

    def test_is_none_when_no_profile_info(self, gql_mock):
        response_mock.json.return_value = {"data": {"myProfile": None}}

        assert_that(self.reader.get_user_birthday()).is_none()

    def test_get_token_with_no_bearer_prefix(self, gql_mock):
        request = mock.MagicMock()
        token = b"jwtokeny"
        request.headers = {"X-Authorization": token}
        reader = UserBirthdayReader(request)
        expected_token = b"Bearer " + token

        assert_that(reader.token).is_equal_to(expected_token)

    def test_get_token_with_bearer_prefix(self, gql_mock):
        request = mock.MagicMock()
        token = b"Bearer jwtokeny"
        request.headers = {"X-Authorization": token}
        reader = UserBirthdayReader(request)

        assert_that(reader.token).is_equal_to(token)

    def test_get_profile_id(self, gql_mock):
        response_mock.json.return_value = self.__get_profile_gql_response()
        assert_that(self.reader.get_user_profile_id()).is_equal_to("aaa-bbb-ccc")
