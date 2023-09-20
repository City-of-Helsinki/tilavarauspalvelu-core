import pytest
from assertpy import assert_that
from django.urls import reverse

from users.models import ReservationNotification


@pytest.mark.django_db()
def test_normal_user_can_view_only_self(user_api_client, user_2):
    response = user_api_client.get(
        reverse("user-list"),
        format="json",
    )
    assert response.status_code == 200
    user_id_list = (x["id"] for x in response.data)
    assert_that(user_id_list).does_not_contain(user_2.id)


@pytest.mark.django_db()
def test_user_can_view_current_user(user_api_client, user):
    response = user_api_client.get(
        reverse("user-current"),
        format="json",
    )

    assert response.status_code == 200
    assert response.data["id"] == user.id


@pytest.mark.django_db()
def test_general_admin_can_view_all_users(general_admin_api_client, general_admin, user, user_2):
    response = general_admin_api_client.get(
        reverse("user-list"),
        format="json",
    )

    assert response.status_code == 200
    user_id_list = [x["id"] for x in response.data]

    assert_that(user_id_list).contains_only(user.id, user_2.id, general_admin.id)


@pytest.mark.django_db()
def test_roles_are_included_in_user_data(service_sector_admin, service_sector_admin_api_client):
    response = service_sector_admin_api_client.get(
        reverse("user-current"),
        format="json",
    )
    assert response.status_code == 200
    assert_that(response.data["service_sector_roles"][0]).contains_entry({"role": "admin"})


@pytest.mark.django_db()
def test_unauthenticated_cannot_get_user_data(unauthenticated_api_client):
    response = unauthenticated_api_client.get(
        reverse("user-list"),
        format="json",
    )

    assert response.status_code == 401


@pytest.mark.django_db()
def test_normal_user_does_not_see_notification_field(user_api_client):
    response = user_api_client.get(
        reverse("user-list"),
        format="json",
    )
    assert response.status_code == 200
    assert response.data[0]["reservation_notification"] is None


@pytest.mark.django_db()
def test_staff_user_sees_notification_field(staff_user_api_client):
    response = staff_user_api_client.get(
        reverse("user-list"),
        format="json",
    )

    assert response.status_code == 200
    assert response.data[0]["reservation_notification"] == ReservationNotification.ALL
