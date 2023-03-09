import datetime
from unittest import mock
from uuid import UUID

from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from helusers.user_utils import convert_to_uuid

from users.utils.open_city_profile.birthday_resolver import resolve_user

response_mock = mock.MagicMock()


@override_settings(OPEN_CITY_PROFILE_LEVELS_OF_ASSURANCES=["substantial", "high"])
@mock.patch("requests.get", return_value=response_mock)
class ResolveUserTestCase(TestCase):
    @classmethod
    def __get_profile_gql_response(self):
        return {
            "data": {
                "myProfile": {
                    "id": "aaa-bbb-ccc",
                    "verifiedPersonalInformation": {
                        "nationalIdentificationNumber": "120345-6789"
                    },
                }
            }
        }

    @classmethod
    def setUpTestData(cls):
        response_mock.status_code = 200
        response_mock.json.return_value = cls.__get_profile_gql_response()
        cls.request = mock.MagicMock()
        cls.request.headers = {"X-Authorization": b"jwtokeny"}

        cls.uuid = convert_to_uuid("12345")
        cls.user = get_user_model().objects.create(
            username="profile_user",
            first_name="Profile",
            last_name="User",
            email="prof.user@localhost",
            uuid=UUID(cls.uuid),
        )

    def get_payload(self):
        return {
            "sub": str(self.uuid),
            "loa": "substantial",
        }

    def test_user_birthday_is_updated(self, req_mock):
        resolve_user(self.request, self.get_payload())
        the_birth_day = datetime.date(1945, 3, 12)

        self.user.refresh_from_db()
        assert_that(self.user.date_of_birth).is_equal_to(the_birth_day)

    def test_birthday_is_not_checked_if_loa_not_in_configured_values(self, req_mock):
        payload = self.get_payload()
        payload["loa"] = "low"

        resolve_user(self.request, payload)

        self.user.refresh_from_db()
        assert_that(self.user.date_of_birth).is_none()

    def test_birthday_not_updated_when_birthday_already_existing(self, req_mock):
        birth_of_day = datetime.date(2020, 1, 1)
        self.user.date_of_birth = birth_of_day
        self.user.save()

        resolve_user(self.request, self.get_payload())

        self.user.refresh_from_db()
        assert_that(self.user.date_of_birth).is_equal_to(birth_of_day)
        assert_that(req_mock.call_count).is_zero()

    def test_user_profile_id_is_updated(self, req_mock):
        resolve_user(self.request, self.get_payload())
        profile_id = "aaa-bbb-ccc"

        self.user.refresh_from_db()
        assert_that(self.user.profile_id).is_equal_to(profile_id)
