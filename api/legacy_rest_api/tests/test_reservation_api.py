import datetime
from typing import Any

import pytest
from django.urls import reverse

from reservations.models import Reservation


@pytest.mark.django_db()
def test_reservation_create(user_api_client, valid_reservation_data, user):
    assert Reservation.objects.count() == 0
    response = user_api_client.post(reverse("reservation-list"), data=valid_reservation_data, format="json")
    assert response.status_code == 201
    assert Reservation.objects.all()[0].user == user
    assert Reservation.objects.count() == 1


@pytest.mark.django_db()
def test_reservation_overlapping(user_api_client, reservation, valid_reservation_data):
    """
    Reservation begins 5 minutes before the initial reservation ends,
    so this should return an error
    """
    valid_reservation_data["begin"] = reservation.end - datetime.timedelta(minutes=5)
    valid_reservation_data["end"] = reservation.end + datetime.timedelta(hours=1)
    response = user_api_client.post(reverse("reservation-list"), data=valid_reservation_data, format="json")
    assert response.status_code == 400


@pytest.mark.django_db()
def test_reservation_overlapping_with_child_space(
    user_api_client,
    confirmed_reservation,
    valid_reservation_data,
    reservation_unit_with_child_space,
):
    """
    Reservation begins 5 minutes before the initial reservation ends,
    so this should return an error
    """
    valid_reservation_data["begin"] = confirmed_reservation.end - datetime.timedelta(minutes=5)
    valid_reservation_data["end"] = confirmed_reservation.end + datetime.timedelta(hours=1)
    valid_reservation_data["reservation_unit"] = [reservation_unit_with_child_space.pk]
    response = user_api_client.post(reverse("reservation-list"), data=valid_reservation_data, format="json")
    assert response.status_code == 400


@pytest.mark.django_db()
def test_reservation_overlapping_with_parent_space(
    user_api_client,
    confirmed_reservation,
    valid_reservation_data,
    reservation_unit_with_parent_space,
):
    """
    Reservation begins 5 minutes before the initial reservation ends,
    so this should return an error
    """
    valid_reservation_data["begin"] = confirmed_reservation.end - datetime.timedelta(minutes=5)
    valid_reservation_data["end"] = confirmed_reservation.end + datetime.timedelta(hours=1)
    valid_reservation_data["reservation_unit"] = [reservation_unit_with_parent_space.pk]
    response = user_api_client.post(reverse("reservation-list"), data=valid_reservation_data, format="json")
    assert response.status_code == 400


@pytest.mark.django_db()
def test_reservation_overlapping_with_same_resource(
    user_api_client,
    confirmed_reservation,
    valid_reservation_data,
    reservation_unit_with_resource,
):
    """
    Reservation begins 5 minutes before the initial reservation ends,
    so this should return an error
    """
    valid_reservation_data["begin"] = confirmed_reservation.end - datetime.timedelta(minutes=5)
    valid_reservation_data["end"] = confirmed_reservation.end + datetime.timedelta(hours=1)
    valid_reservation_data["reservation_unit"] = [reservation_unit_with_resource.pk]
    response = user_api_client.post(reverse("reservation-list"), data=valid_reservation_data, format="json")
    assert response.status_code == 400


@pytest.mark.django_db()
def test_reservation_fetch_should_filter_by_status(user_api_client, reservation):
    url = f"{reverse('reservation-list')}?state=created&state=cancelled"

    response = user_api_client.get(url, format="json")
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0].get("state") == "created"

    url = f"{reverse('reservation-list')}?state=cancelled&state=denied"

    response = user_api_client.get(url, format="json")
    assert response.status_code == 200
    assert len(response.data) == 0


@pytest.mark.django_db()
def test_reservation_fetch_effectively_active_reservations(user_api_client, reservation, confirmed_reservation):
    url = f"{reverse('reservation-list')}?active=true"

    response = user_api_client.get(url, format="json")
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0].get("state") == "confirmed"

    url = f"{reverse('reservation-list')}?active=false"

    response = user_api_client.get(url, format="json")
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0].get("state") == "created"


@pytest.mark.django_db()
def test_reservation_fetch_filtering_by_reservation_unit(
    user_api_client,
    reservation_unit,
    reservation_unit2,
    reservation,
    confirmed_reservation,
    reservation_in_second_unit,
):
    def to_reservation_unit_ids(data: list[dict[str, Any]]) -> list[int]:
        res_unit_ids = []
        for reservation in data:
            reservation_res_unit_ids = [res_unit["id"] for res_unit in reservation["reservation_unit"]]
            res_unit_ids.extend(reservation_res_unit_ids)

        return res_unit_ids

    url = f"{reverse('reservation-list')}?reservation_unit={reservation_unit.id}"

    response = user_api_client.get(url, format="json")
    assert response.status_code == 200
    assert len(response.data) == 2

    assert to_reservation_unit_ids(response.data) == [
        reservation_unit.id,
        reservation_unit.id,
    ]

    url = f"{reverse('reservation-list')}?reservation_unit={reservation_unit2.id}"

    response = user_api_client.get(url, format="json")
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0].get("state") == "created"

    assert to_reservation_unit_ids(response.data) == [reservation_unit2.id]


@pytest.mark.django_db()
def test_user_can_create_reservation(user_api_client, valid_reservation_data):
    response = user_api_client.post(reverse("reservation-list"), valid_reservation_data, format="json")
    assert response.status_code == 201


@pytest.mark.django_db()
def test_user_can_update_own_reservation(user_api_client, valid_reservation_data, reservation):
    response = user_api_client.put(
        reverse("reservation-detail", kwargs={"pk": reservation.id}),
        data=valid_reservation_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db()
def test_user_cannot_view_or_update_other_users_reservation(user_2_api_client, valid_reservation_data, reservation):
    response = user_2_api_client.get(
        reverse("reservation-detail", kwargs={"pk": reservation.id}),
        format="json",
    )
    assert response.status_code == 404

    response = user_2_api_client.put(
        reverse("reservation-detail", kwargs={"pk": reservation.id}),
        data=valid_reservation_data,
        format="json",
    )
    assert response.status_code == 404


@pytest.mark.django_db()
def test_general_admin_can_update_users_reservation(general_admin_api_client, valid_reservation_data, reservation):
    response = general_admin_api_client.put(
        reverse("reservation-detail", kwargs={"pk": reservation.id}),
        data=valid_reservation_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db()
def test_unit_admin_can_update_users_reservation(unit_admin_api_client, valid_reservation_data, reservation):
    response = unit_admin_api_client.put(
        reverse("reservation-detail", kwargs={"pk": reservation.id}),
        data=valid_reservation_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db()
def test_unit_manager_can_update_users_reservation(unit_manager_api_client, valid_reservation_data, reservation):
    response = unit_manager_api_client.put(
        reverse("reservation-detail", kwargs={"pk": reservation.id}),
        data=valid_reservation_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db()
def test_unit_viewer_cannot_update_users_reservation(unit_viewer_api_client, valid_reservation_data, reservation):
    response = unit_viewer_api_client.put(
        reverse("reservation-detail", kwargs={"pk": reservation.id}),
        data=valid_reservation_data,
        format="json",
    )
    assert response.status_code == 403


@pytest.mark.django_db()
def test_unit_viewer_can_view_users_reservation(unit_viewer_api_client, reservation):
    response = unit_viewer_api_client.get(
        reverse("reservation-detail", kwargs={"pk": reservation.id}),
        format="json",
    )
    assert response.status_code == 200
