from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

from tilavarauspalvelu.integrations.helsinki_profile.clients import HelsinkiProfileClient

from tests.factories import UnitFactory, UserFactory
from tests.helpers import patch_method

from .helpers import current_user_query

if TYPE_CHECKING:
    from tilavarauspalvelu.models import GeneralRole

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(HelsinkiProfileClient.ensure_token_valid)
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
            role
        }
        unitRoles {
            role
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
        "unitRoles": [],
    }

    assert HelsinkiProfileClient.ensure_token_valid.call_count == 1


@patch_method(HelsinkiProfileClient.ensure_token_valid)
def test_query_current_user__unauthenticated(graphql):
    # given:
    # - An anonymous user is using the system

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
            role
        }
        unitRoles {
            role
        }
    """

    # when:
    # - User tries to search for current user with all fields
    response = graphql(current_user_query(fields=fields))

    # then:
    # - The response contains the expected data
    assert response.has_errors is False, response.errors
    assert response.first_query_object is None


@patch_method(HelsinkiProfileClient.ensure_token_valid)
def test_query_current_user__general_roles(graphql):
    # given:
    # - There is a general admin in the system
    # - That admin is using the system
    user = UserFactory.create_with_general_role()
    general_role: GeneralRole = user.general_roles.first()
    graphql.force_login(user)

    fields = """
        pk
        generalRoles {
            role
            assigner {
                firstName
                lastName
            }
            createdAt
            updatedAt
            permissions
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
                "role": general_role.role,
                "assigner": None,
                "createdAt": general_role.created_at.isoformat(),
                "updatedAt": general_role.updated_at.isoformat(),
                "permissions": [
                    "CAN_CREATE_STAFF_RESERVATIONS",
                    "CAN_MANAGE_APPLICATIONS",
                    "CAN_MANAGE_NOTIFICATIONS",
                    "CAN_MANAGE_RESERVATIONS",
                    "CAN_MANAGE_RESERVATION_RELATED_DATA",
                    "CAN_MANAGE_RESERVATION_UNITS",
                    "CAN_VIEW_APPLICATIONS",
                    "CAN_VIEW_RESERVATIONS",
                    "CAN_VIEW_USERS",
                ],
            },
        ],
    }


@patch_method(HelsinkiProfileClient.ensure_token_valid)
def test_query_current_user__unit_admin(graphql):
    # given:
    # - There is a unit in the system
    # - There is a unit admin for that unit in the system
    # - That admin is using the system
    unit = UnitFactory.create()
    user = UserFactory.create_with_unit_role(units=[unit])
    unit_role = user.unit_roles.first()
    graphql.force_login(user)

    fields = """
        pk
        unitRoles {
            role
            units {
                pk
            }
            unitGroups {
                pk
            }
            assigner {
                firstName
                lastName
            }
            createdAt
            updatedAt
            permissions
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
                "role": unit_role.role,
                "units": [
                    {
                        "pk": unit.pk,
                    }
                ],
                "unitGroups": [],
                "assigner": None,
                "createdAt": unit_role.created_at.isoformat(),
                "updatedAt": unit_role.updated_at.isoformat(),
                "permissions": [
                    "CAN_CREATE_STAFF_RESERVATIONS",
                    "CAN_MANAGE_APPLICATIONS",
                    "CAN_MANAGE_NOTIFICATIONS",
                    "CAN_MANAGE_RESERVATIONS",
                    "CAN_MANAGE_RESERVATION_RELATED_DATA",
                    "CAN_MANAGE_RESERVATION_UNITS",
                    "CAN_VIEW_APPLICATIONS",
                    "CAN_VIEW_RESERVATIONS",
                    "CAN_VIEW_USERS",
                ],
            },
        ],
    }


@patch_method(HelsinkiProfileClient.ensure_token_valid)
def test_query_current_user__reservation_notification(graphql):
    # given:
    # - There is a superuser user in the system
    # - That user is using the system
    user = UserFactory.create_superuser()
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
        "reservationNotification": user.reservation_notification.value.upper(),
    }


@patch_method(HelsinkiProfileClient.ensure_token_valid)
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


@patch_method(HelsinkiProfileClient.ensure_token_valid)
def test_query_current_user__ad_login(graphql):
    # given:
    # - There is a user logged in with azure ad
    # - That user is using the system
    user = UserFactory.create_ad_user()
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


@patch_method(HelsinkiProfileClient.ensure_token_valid)
def test_query_current_user__suomi_fi_login(graphql):
    # given:
    # - There is a user logged in with azure ad
    # - That user is using the system
    user = UserFactory.create_profile_user()
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
