from __future__ import annotations

import datetime

import freezegun
import pytest
from graphene_django_extensions.testing import build_query
from graphql_relay import to_global_id

from tilavarauspalvelu.enums import UserRoleChoice
from tilavarauspalvelu.models import PersonalInfoViewLog

from tests.factories import GeneralRoleFactory, ReservationFactory, UnitRoleFactory, UserFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_user__query__through_reservation(graphql):
    user = UserFactory.create()
    reservation = ReservationFactory.create(user=user)

    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    fields = """
        user {
            pk
            username
            firstName
            lastName
            email
            isSuperuser
            reservationNotification
        }
    """

    global_id = to_global_id("ReservationNode", reservation.pk)
    query = build_query("reservation", fields=fields, id=global_id)
    response = graphql(query)

    assert response.has_errors is False, response.errors

    assert response.first_query_object == {
        "user": {
            "pk": user.pk,
            "username": user.username,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "email": user.email,
            "isSuperuser": user.is_superuser,
            "reservationNotification": None,
        },
    }


def test_user__query__through_reservation__roles_of_another_user_are_hidden(graphql):
    user = UserFactory.create()
    GeneralRoleFactory.create(user=user, role=UserRoleChoice.RESERVER)
    UnitRoleFactory.create(user=user, role=UserRoleChoice.RESERVER)
    reservation = ReservationFactory.create(user=user)

    admin = UserFactory.create_with_general_role(role=UserRoleChoice.ADMIN)
    graphql.force_login(admin)

    fields = """
        user {
            generalRoles {
                role
                permissions
            }
            unitRoles {
                role
                permissions
            }
        }
    """

    global_id = to_global_id("ReservationNode", reservation.pk)
    query = build_query("reservation", fields=fields, id=global_id)
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object == {
        "user": {
            "generalRoles": [],
            "unitRoles": [],
        },
    }


@freezegun.freeze_time("2021-01-01T12:00:00Z")
def test_user__query__through_reservation__date_of_birth_read_is_logged(graphql):
    user = UserFactory.create()
    reservation = ReservationFactory.create(user=user)

    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    global_id = to_global_id("ReservationNode", reservation.pk)
    query = build_query("reservation", fields="user { pk dateOfBirth }", id=global_id)
    response = graphql(query)

    assert response.has_errors is False, response.errors

    assert response.first_query_object == {
        "user": {
            "pk": user.pk,
            "dateOfBirth": user.date_of_birth.isoformat(),
        },
    }

    assert PersonalInfoViewLog.objects.count() == 1
    view_log = PersonalInfoViewLog.objects.first()
    assert view_log is not None

    assert view_log.user == user
    assert view_log.viewer_user == admin
    assert view_log.viewer_username == admin.username
    assert view_log.access_time == datetime.datetime.now(tz=datetime.UTC)
    assert view_log.field == "User.date_of_birth"
