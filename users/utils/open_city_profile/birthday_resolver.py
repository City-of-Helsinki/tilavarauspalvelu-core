import datetime

import requests
from django.conf import settings
from helusers.user_utils import get_or_create_user
from requests import RequestException
from sentry_sdk import capture_exception, capture_message
from simplejson.errors import JSONDecodeError

from users.utils.open_city_profile.basic_info_resolver import (
    ProfileNodeIdReader,
    ProfileReadError,
)
from users.utils.open_city_profile.mixins import ProfileReaderTokenMixin

REQUEST_TIMEOUT_SECONDS = 5


def resolve_user(request, payload):
    user = get_or_create_user(payload, oidc=True)

    if not user.profile_id and not user.has_staff_permissions:
        try:
            profile_id_reader = ProfileNodeIdReader(request)
            user.profile_id = profile_id_reader.get_user_profile_id()
        except ProfileReadError as e:
            capture_exception(e)
        else:
            user.save()

    # If auth method is in configured loa levels we can try to read the date of birth of the user.
    if (
        payload.get("loa", "").lower()
        in settings.OPEN_CITY_PROFILE_LEVELS_OF_ASSURANCES
        and not user.date_of_birth
    ):
        b_day_reader = UserBirthdayReader(request)
        try:
            birthday = b_day_reader.get_user_birthday()
        except (BirthDayReaderError, RequestException) as e:
            capture_exception(e)
        else:
            if birthday:
                user.date_of_birth = birthday
                user.save()

                return user

            capture_message(
                "Tried to read birthday from open profile; it resulted none",
                level="warning",
            )

    return user


class BirthDayReaderError(Exception):
    pass


class BirthDayReaderTokenNullOrEmptyError(BirthDayReaderError):
    pass


class BirthDayReaderQueryError(BirthDayReaderError):
    pass


class UserBirthdayReader(ProfileReaderTokenMixin):
    """Reads birthday from national identification number stored in open city profile"""

    CENTURY = {
        "A": 2000,
        "B": 2000,
        "C": 2000,
        "D": 2000,
        "E": 2000,
        "F": 2000,
        "-": 1900,
        "Y": 1900,
        "X": 1900,
        "W": 1900,
        "V": 1900,
        "U": 1900,
    }

    def __init__(self, request):
        self.request = request
        self.response_data = None

    def get_user_birthday(self) -> [datetime.date, None]:
        nin = self.__get_national_identification_number()
        if not nin or len(nin) != 11:
            return None

        century = self.CENTURY.get(nin[6])
        if not century:
            return None

        b_day = datetime.date(
            year=century + int(nin[4:6]),
            month=int(nin[2:4]),
            day=int(nin[0:2]),
        )

        return b_day

    def get_user_profile_id(self) -> [str, None]:
        if not self.response_data:
            self.response_data = self.__make_profile_request(self.token)

        self.__check_for_errors()

        my_profile_data = self.__get_my_profile_data()

        if not my_profile_data:
            return None

        return my_profile_data.get("id")

    def __check_for_errors(self):
        if self.response_data.get("errors"):
            message = next(iter(self.response_data.get("errors"))).get("message")
            raise BirthDayReaderQueryError(message)

    def __get_my_profile_data(self):
        data = self.response_data.get("data")

        if not data:
            return None

        return data.get("myProfile")

    def __get_national_identification_number(self) -> [str, None]:
        nin = None

        if not self.token:
            raise BirthDayReaderTokenNullOrEmptyError()

        if not self.response_data:
            self.response_data = self.__make_profile_request(self.token)

        self.__check_for_errors()

        my_profile_data = self.__get_my_profile_data()

        if not my_profile_data:
            return None

        verified_personal_info = my_profile_data.get("verifiedPersonalInformation")
        if verified_personal_info:
            nin = verified_personal_info.get("nationalIdentificationNumber")

        return nin

    def __make_profile_request(self, token) -> dict:
        query = """
                    query {
                        myProfile {
                            verifiedPersonalInformation {
                                nationalIdentificationNumber
                            }
                        }
                    }
                """

        response = requests.get(
            settings.OPEN_CITY_PROFILE_GRAPHQL_API,
            json={"query": query},
            headers={"Authorization": token},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

        status = response.status_code
        if status >= 400 and status < 500:
            try:
                data = response.json()
            except JSONDecodeError:
                raise BirthDayReaderError(
                    "Got %s status code from profile and could not json decode the data"
                    % response.status_code
                )
        elif status >= 500:
            raise BirthDayReaderError(
                "Got internal server error while querying profile data"
            )
        else:
            data = response.json()

        return data
