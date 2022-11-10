import datetime

import requests
from django.conf import settings
from helusers.user_utils import get_or_create_user
from requests import RequestException
from rest_framework import HTTP_HEADER_ENCODING
from sentry_sdk import capture_exception, capture_message


def resolve_user(request, payload):
    user = get_or_create_user(payload, oidc=True)

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


class UserBirthdayReader:
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

    def __get_token(self):
        token = self.request.headers.get("X-Authorization", b"")

        if isinstance(token, str):
            token = token.encode(HTTP_HEADER_ENCODING)

        if token and not token.startswith(b"Bearer"):
            token = b"Bearer " + token

        return token

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

    def __get_national_identification_number(self) -> [str, None]:
        nin = None

        token = self.__get_token()
        if not token:
            raise BirthDayReaderTokenNullOrEmptyError()

        response_data = self.__read_national_identification_number_from_source(token)

        if response_data.get("errors"):
            message = next(iter(response_data.get("errors"))).get("message")
            raise BirthDayReaderQueryError(message)

        data = response_data.get("data")

        if not data:
            return None

        my_profile_data = data.get("myProfile")

        if not my_profile_data:
            return None

        verified_personal_info = my_profile_data.get("verifiedPersonalInformation")
        if verified_personal_info:
            nin = verified_personal_info.get("nationalIdentificationNumber")

        return nin

    def __read_national_identification_number_from_source(self, token) -> dict:
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
        )

        data = response.json()

        return data
