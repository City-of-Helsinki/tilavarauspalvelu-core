from typing import TYPE_CHECKING

import pytest

from tests.factories import ServiceSectorFactory, UnitFactory, UserFactory, UserSocialAuthFactory
from tests.helpers import UserType

from .helpers import current_user_query

if TYPE_CHECKING:
    from permissions.models import GeneralRole, ServiceSectorRole, UnitRole

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_query_current_user__all_fields(graphql):
    # given:
    # - There is a user in the system
    # - That user is using the system
    user = UserFactory.create()
    graphql.force_login(user)

    fields = """
        pk
        uuid
        firstName
        lastName
        email
        dateOfBirth
        isAdAuthenticated
        isStronglyAuthenticated
        isSuperuser
        reservationNotification
        generalRoles {
            pk
        }
        serviceSectorRoles {
            pk
        }
        unitRoles {
            pk
        }
    """

    # when:
    # - User tries to search for current user with all fields
    response = graphql(current_user_query(fields=fields))

    # then:
    # - The response contains the expected data
    assert response.has_errors is False, response
    assert response.first_query_object == {
        "pk": user.pk,
        "uuid": str(user.uuid),
        "firstName": user.first_name,
        "lastName": user.last_name,
        "email": user.email,
        "dateOfBirth": user.date_of_birth.isoformat(),
        "isAdAuthenticated": False,
        "isStronglyAuthenticated": False,
        "isSuperuser": False,
        "reservationNotification": None,
        "generalRoles": [],
        "serviceSectorRoles": [],
        "unitRoles": [],
    }


def test_query_current_user__unauthenticated(graphql):
    # given:
    # - An anonymous user is using the system
    graphql.login_user_based_on_type(UserType.ANONYMOUS)

    fields = """
        pk
        uuid
        firstName
        lastName
        email
        dateOfBirth
        isAdAuthenticated
        isStronglyAuthenticated
        isSuperuser
        reservationNotification
        generalRoles {
            pk
        }
        serviceSectorRoles {
            pk
        }
        unitRoles {
            pk
        }
    """

    # when:
    # - User tries to search for current user with all fields
    response = graphql(current_user_query(fields=fields))

    # then:
    # - The response contains the expected data
    assert response.has_errors is False, response.errors
    assert response.first_query_object is None


def test_query_current_user__general_roles(graphql):
    # given:
    # - There is a general admin in the system
    # - That admin is using the system
    user = UserFactory.create_with_general_permissions(
        first_name="Unique",
        last_name="Admin",
        perms=["can_manage_general_roles"],
    )

    general_role: GeneralRole = user.general_roles.first()
    graphql.force_login(user)

    fields = """
        pk
        generalRoles {
            pk
            role {
                code
                verboseName
                verboseNameFi
                verboseNameSv
                verboseNameEn
                permissions {
                    permission
                }
            }
        }
    """

    # when:
    # - User tries to search for current user general permissions
    response = graphql(current_user_query(fields=fields))

    # then:
    # - The response contains the expected data
    assert response.has_errors is False, response
    assert response.first_query_object == {
        "pk": user.pk,
        "generalRoles": [
            {
                "pk": general_role.pk,
                "role": {
                    "code": general_role.role.code,
                    "verboseName": general_role.role.verbose_name,
                    "verboseNameFi": general_role.role.verbose_name_fi,
                    "verboseNameSv": general_role.role.verbose_name_sv,
                    "verboseNameEn": general_role.role.verbose_name_en,
                    "permissions": [
                        {
                            "permission": perm.permission.upper(),
                        }
                        for perm in general_role.role.permissions.all()
                    ],
                },
            },
        ],
    }


def test_query_current_user__service_sector_roles(graphql):
    # given:
    # - There is a service sector in the system
    # - There is a service sector admin for that service sector in the system
    # - That admin is using the system
    sector = ServiceSectorFactory.create()
    user = UserFactory.create_with_service_sector_permissions(
        service_sector=sector,
        perms=["can_manage_service_sector_roles"],
    )
    service_sector_role: ServiceSectorRole = user.service_sector_roles.first()
    graphql.force_login(user)

    fields = """
        pk
        serviceSectorRoles {
            pk
            role {
                code
                verboseName
                verboseNameFi
                verboseNameSv
                verboseNameEn
                permissions {
                    permission
                }
            }
            serviceSector {
                nameFi
            }
        }
    """

    # when:
    # - User tries to search for current user service sector permissions
    response = graphql(current_user_query(fields=fields))

    # then:
    # - The response contains the expected data
    assert response.has_errors is False, response
    assert response.first_query_object == {
        "pk": user.pk,
        "serviceSectorRoles": [
            {
                "pk": service_sector_role.pk,
                "role": {
                    "code": service_sector_role.role.code,
                    "verboseName": service_sector_role.role.verbose_name,
                    "verboseNameFi": service_sector_role.role.verbose_name_fi,
                    "verboseNameSv": service_sector_role.role.verbose_name_sv,
                    "verboseNameEn": service_sector_role.role.verbose_name_en,
                    "permissions": [
                        {
                            "permission": perm.permission.upper(),
                        }
                        for perm in service_sector_role.role.permissions.all()
                    ],
                },
                "serviceSector": {
                    "nameFi": sector.name_fi,
                },
            },
        ],
    }


def test_query_current_user__unit_admin(graphql):
    # given:
    # - There is a unit in the system
    # - There is a unit admin for that unit in the system
    # - That admin is using the system
    unit = UnitFactory.create()
    user = UserFactory.create_with_unit_permissions(
        unit=unit,
        perms=["can_manage_unit_roles"],
    )
    unit_role: UnitRole = user.unit_roles.first()
    graphql.force_login(user)

    fields = """
        pk
        unitRoles {
            pk
            role {
                code
                verboseName
                verboseNameFi
                verboseNameSv
                verboseNameEn
                permissions {
                    permission
                }
            }
            unit {
                nameFi
            }
            unitGroup {
                name
            }
        }
    """

    # when:
    # - User tries to search for current user unit permissions
    response = graphql(current_user_query(fields=fields))

    # then:
    # - The response contains the expected data
    assert response.has_errors is False, response
    assert response.first_query_object == {
        "pk": user.pk,
        "unitRoles": [
            {
                "pk": unit_role.pk,
                "role": {
                    "code": unit_role.role.code,
                    "verboseName": unit_role.role.verbose_name,
                    "verboseNameFi": unit_role.role.verbose_name_fi,
                    "verboseNameSv": unit_role.role.verbose_name_sv,
                    "verboseNameEn": unit_role.role.verbose_name_en,
                    "permissions": [
                        {
                            "permission": perm.permission.upper(),
                        }
                        for perm in unit_role.role.permissions.all()
                    ],
                },
                "unit": [
                    {
                        "nameFi": unit.name_fi,
                    },
                ],
                "unitGroup": [],
            },
        ],
    }


def test_query_current_user__reservation_notification(graphql):
    # given:
    # - There is a staff user in the system
    # - That user is using the system
    user = UserFactory.create_staff_user()
    graphql.force_login(user)

    fields = """
        pk
        reservationNotification
    """

    # when:
    # - User tries to search for current user reservation notification
    response = graphql(current_user_query(fields=fields))

    # then:
    # - The response contains reservation notification because the user has staff permissions
    assert response.has_errors is False, response
    assert response.first_query_object == {
        "pk": user.pk,
        "reservationNotification": user.reservation_notification,
    }


def test_query_current_user__reservation_notification__hidden_for_non_staff(graphql):
    # given:
    # - There is a regular user in the system
    # - That user is using the system
    user = UserFactory.create()
    graphql.force_login(user)

    fields = """
        pk
        reservationNotification
    """

    # when:
    # - User tries to search for current user reservation notification
    response = graphql(current_user_query(fields=fields))

    # then:
    # - The response does not contain reservation notification because the user does not have staff permissions
    assert response.has_errors is False, response
    assert response.first_query_object == {
        "pk": user.pk,
        "reservationNotification": None,
    }


def test_query_current_user__ad_login(graphql):
    # given:
    # - There is a user logged in with azure ad
    # - That user is using the system
    user = UserFactory.create()
    UserSocialAuthFactory.create(user=user, extra_data__amr="helsinkiazuread", extra_data__loa="low")
    graphql.force_login(user)

    fields = """
        pk
        isAdAuthenticated
        isStronglyAuthenticated
    """

    # when:
    # - User tries to search for current user auth state info
    response = graphql(current_user_query(fields=fields))

    # then:
    # - The response contains expected info on auth state
    assert response.has_errors is False, response
    assert response.first_query_object == {
        "pk": user.pk,
        "isAdAuthenticated": True,
        "isStronglyAuthenticated": False,
    }


def test_query_current_user__suomi_fi_login(graphql):
    # given:
    # - There is a user logged in with azure ad
    # - That user is using the system
    user = UserFactory.create()
    UserSocialAuthFactory.create(user=user, extra_data__amr="suomi_fi", extra_data__loa="substantial")
    graphql.force_login(user)

    fields = """
        pk
        isAdAuthenticated
        isStronglyAuthenticated
    """

    # when:
    # - User tries to search for current user auth state info
    response = graphql(current_user_query(fields=fields))

    # then:
    # - The response contains expected info on auth state
    assert response.has_errors is False, response
    assert response.first_query_object == {
        "pk": user.pk,
        "isAdAuthenticated": False,
        "isStronglyAuthenticated": True,
    }
