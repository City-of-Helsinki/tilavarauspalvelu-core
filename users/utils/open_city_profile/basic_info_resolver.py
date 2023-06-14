from typing import Dict, Optional

import requests
from django.conf import settings
from simplejson.errors import JSONDecodeError

from applications.models import City
from users.utils.open_city_profile.mixins import ProfileReaderTokenMixin

REQUEST_TIMEOUT_SECONDS = 5


class ProfileReadError(Exception):
    pass


class ProfileUserInfoReader(ProfileReaderTokenMixin):
    fields = []

    def __init__(self, user, request):
        self.user = user
        self.request = request
        self.vp_info = None
        self.data = None
        self.__read_fields()

    def __get_query(self):
        return """query {
            myProfile {
                firstName
                lastName
                nickname
                language
                phones {
                    edges {
                        node {
                            phone
                            primary
                            phoneType
                        }
                    }
                }
                primaryPhone {
                    phone
                    primary
                    phoneType
                }
                emails {
                    edges {
                        node {
                            email
                            primary
                            emailType
                        }
                    }
                }
                primaryEmail {
                    email
                    primary
                    emailType
                }
                addresses {
                    edges {
                        node {
                            primary
                            address
                            postalCode
                            city
                            countryCode
                            addressType
                        }
                    }
                }
                primaryAddress {
                    primary
                    address
                    postalCode
                    city
                    countryCode
                    addressType
                }
                verifiedPersonalInformation {
                    firstName
                    lastName
                    municipalityOfResidence
                    municipalityOfResidenceNumber
                    permanentAddress {
                         streetAddress
                         postalCode
                         postOffice
                    }
                    permanentForeignAddress {
                        streetAddress
                        additionalAddress
                        countryCode
                    }
                }
            }
        }
        """

    def __read_fields(self):
        query = self.__get_query()

        response = requests.get(
            settings.OPEN_CITY_PROFILE_GRAPHQL_API,
            json={"query": query},
            headers={"Authorization": self.token},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

        status = response.status_code
        if status >= 400 and status < 500:
            try:
                self.data = response.json()
            except JSONDecodeError:
                raise ProfileReadError(
                    "Got %s status code from profile and could not json decode the data"
                    % response.status_code
                )
        elif status >= 500:
            raise ProfileReadError(
                "Got internal server error while querying profile data"
            )
        else:
            self.data = response.json().get("data", {}).get("myProfile", {}) or {}

        self.vp_info = self.data.get("verifiedPersonalInformation", {})

    def get_user_home_city(self) -> Optional[City]:
        if not self.vp_info:
            return None

        city_str = self.vp_info.get("municipalityOfResidence")
        mun_code = self.vp_info.get("municipalityOfResidenceNumber")

        city = None

        if mun_code == settings.PRIMARY_MUNICIPALITY_NUMBER:
            city = City.objects.filter(municipality_code=mun_code).first()

        if not city and city_str == settings.PRIMARY_MUNICIPALITY_NAME:
            city = City.objects.filter(name__iexact=city_str).first()

        if not city:
            city = City.objects.filter(
                name__iexact=settings.SECONDARY_MUNICIPALITY_NAME
            ).first()

        return city

    def get_phone(self) -> Optional[str]:
        primary_phone = self.data.get("primaryPhone")
        if primary_phone:
            return primary_phone.get("phone")

        phones = self.data.get("phones", {}).get("edges", [])

        type_priorities = ["MOBILE", "HOME", "WORK", "OTHER", "NONE"]

        for type in type_priorities:
            for phone in phones:
                if phone.get("node", {}).get("phoneType") == type:
                    return phone.get("node", {}).get("phone")

        return None

    def get_address(self) -> Optional[Dict]:
        primary_address = self.data.get("primaryAddress")
        if primary_address:
            return primary_address

        address = self._get_address_by_priority()

        if not address:
            address = self._get_permanent_address()

        if not address:
            address = self._get_permanent_foreign_address()

        return address

    def _get_address_by_priority(self):
        type_priorities = ["HOME", "WORK", "OTHER", "NONE"]

        addresses = self.data.get("addresses", {}).get("edges", [])

        for type in type_priorities:
            for address in addresses:
                if address.get("node", {}).get("addressType") == type:
                    return address.get("node", {})
        return None

    def _get_permanent_address(self):
        address = self.vp_info.get("permanentAddress")

        if address:
            return {
                "postalCode": address.get("postalCode"),
                "address": address.get("streetAddress"),
                "city": address.get("postOffice"),
            }

        return None

    def _get_permanent_foreign_address(self):
        address = self.vp_info.get("permanentForeignAddress", None)

        if address:
            return {
                "address": address.get("streetAddress"),
                "countryCode": address.get("countryCode"),
            }

        return None

    def get_first_name(self) -> Optional[str]:
        return self.data.get("firstName")

    def get_last_name(self) -> Optional[str]:
        return self.data.get("lastName")

    def get_email(self) -> Optional[str]:
        primary_email = self.data.get("primaryEmail")
        if primary_email:
            return primary_email.get("email")

        emails = self.data.get("emails", {}).get("edges", [])

        type_priorities = ["PERSONAL", "WORK", "OTHER", "NONE"]

        for type in type_priorities:
            for email in emails:
                if email.get("node", {}).get("emailType") == type:
                    return email.get("node", {}).get("email")
        return None


class ProfileNodeIdReader(ProfileReaderTokenMixin):
    def __init__(self, request):
        self.request = request

    def get_user_profile_id(self) -> [str, None]:
        self.response_data = self.__make_profile_request(self.token)

        self.__check_for_errors()

        my_profile_data = self.__get_my_profile_data()

        if not my_profile_data:
            return None

        return my_profile_data.get("id")

    def __check_for_errors(self):
        if self.response_data.get("errors"):
            message = next(iter(self.response_data.get("errors"))).get("message")
            raise ProfileReadError(message)

    def __get_my_profile_data(self):
        data = self.response_data.get("data")

        if not data:
            return None

        return data.get("myProfile")

    def __make_profile_request(self, token) -> dict:
        query = """
                    query {
                        myProfile {
                            id
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
                raise ProfileReadError(
                    "Got %s status code from profile and could not json decode the data"
                    % response.status_code
                )
        elif status >= 500:
            raise ProfileReadError(
                "Got internal server error while querying profile data"
            )
        else:
            data = response.json()

        return data
