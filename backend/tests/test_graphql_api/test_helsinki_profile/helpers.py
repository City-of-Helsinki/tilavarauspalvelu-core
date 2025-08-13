from __future__ import annotations

from inspect import cleandoc

PROFILE_QUERY = cleandoc(
    """
    query (
        $applicationPk: Int
        $reservationPk: Int
    ) {
        profileData (
            applicationPk: $applicationPk
            reservationPk: $reservationPk
        ) {
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
        }
    }
    """
)

PROFILE_QUERY_MIN = cleandoc(
    """
    query (
        $applicationPk: Int
        $reservationPk: Int
    ) {
        profileData (
            applicationPk: $applicationPk
            reservationPk: $reservationPk
        ) {
            firstName
            lastName
        }
    }
    """
)
