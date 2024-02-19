import datetime

import freezegun
import pytest

from tests.factories import UserFactory
from tests.gql_builders import build_query
from users.models import PersonalInfoViewLog

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_user__query(graphql):
    user = UserFactory.create_staff_user()
    admin = UserFactory.create_with_general_permissions(perms=["can_view_users"])
    graphql.force_login(admin)

    fields = """
        pk
        username
        firstName
        lastName
        email
        isSuperuser
        reservationNotification
    """
    query = build_query("user", fields=fields, pk=user.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert response.first_query_object == {
        "pk": user.pk,
        "username": user.username,
        "firstName": user.first_name,
        "lastName": user.last_name,
        "email": user.email,
        "isSuperuser": user.is_superuser,
        "reservationNotification": user.reservation_notification,
    }


def test_user__query__regular_user_has_no_reservation_notification(graphql):
    user = UserFactory.create()
    admin = UserFactory.create_with_general_permissions(perms=["can_view_users"])
    graphql.force_login(admin)

    fields = """
        pk
        reservationNotification
    """
    query = build_query("user", fields=fields, pk=user.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert response.first_query_object == {
        "pk": user.pk,
        "reservationNotification": None,
    }


@freezegun.freeze_time("2021-01-01T12:00:00Z")
def test_user__query__date_of_birth_read_is_logged(graphql, settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True

    user = UserFactory.create_staff_user()
    admin = UserFactory.create_with_general_permissions(perms=["can_view_users"])
    graphql.force_login(admin)

    query = build_query("user", fields="pk dateOfBirth", pk=user.pk)
    response = graphql(query)

    assert response.has_errors is False

    assert response.first_query_object == {
        "pk": user.pk,
        "dateOfBirth": user.date_of_birth.isoformat(),
    }

    assert PersonalInfoViewLog.objects.count() == 1
    view_log = PersonalInfoViewLog.objects.first()
    assert view_log is not None

    assert view_log.user == user
    assert view_log.viewer_user == admin
    assert view_log.viewer_username == admin.username
    assert view_log.access_time == datetime.datetime.now(tz=datetime.UTC)
    assert view_log.field == "User.date_of_birth"
