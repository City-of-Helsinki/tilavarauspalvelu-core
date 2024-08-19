import pytest

from tests.factories import UnitFactory, UserFactory, UserSocialAuthFactory

from .helpers import current_user_query

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


def test_query_current_user__general_roles(graphql):
    # given:
    # - There is a general admin in the system
    # - That admin is using the system
    user = UserFactory.create_with_general_role()
    general_role = user.general_roles.first()
    graphql.force_login(user)

    fields = """
        pk
        generalRoles {
            role
            assigner {
                firstName
                lastName
            }
            created
            modified
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
                "created": general_role.created.isoformat(),
                "modified": general_role.modified.isoformat(),
            },
        ],
    }


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
            created
            modified
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
                "created": unit_role.created.isoformat(),
                "modified": unit_role.modified.isoformat(),
            },
        ],
    }


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
