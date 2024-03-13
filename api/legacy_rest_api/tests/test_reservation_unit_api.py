import pytest
from django.urls import reverse

from tests.factories import PurposeFactory


@pytest.mark.django_db()
def test_reservation_unit_exists(user_api_client, reservation_unit):
    reservation_unit.name_en = "Studio complex"
    reservation_unit.save()
    response = user_api_client.get(reverse("reservationunit-list"))
    assert response.status_code == 200
    assert response.data[0]["name"]["en"] == "Studio complex"


@pytest.mark.django_db()
def test_reservation_unit_purpose_filter(user_api_client, reservation_unit, reservation_unit2):
    purpose = PurposeFactory()
    purpose2 = PurposeFactory()
    reservation_unit.purposes.set([purpose])
    reservation_unit2.purposes.set([purpose2])
    response = user_api_client.get(reverse("reservationunit-list"))
    assert response.status_code == 200
    assert len(response.data) == 2

    url_with_filter = f"{reverse('reservationunit-list')}?purpose={purpose.pk}"
    filtered_response = user_api_client.get(url_with_filter)
    assert filtered_response.status_code == 200
    assert len(filtered_response.data) == 1
    assert filtered_response.data[0]["name"]["en"] == reservation_unit.name_en

    # Filter should work with multiple query parameters
    url_with_filter = f"{reverse('reservationunit-list')}?purpose={purpose.pk}&purpose={purpose2.pk}"
    filtered_response = user_api_client.get(url_with_filter)
    assert filtered_response.status_code == 200
    assert len(filtered_response.data) == 2


@pytest.mark.django_db()
def test_reservation_unit_application_round_filter(
    user_api_client, reservation_unit, reservation_unit2, application_round
):
    # GET without query paremeters should return all (2) reservation units
    reservation_unit.application_rounds.set([application_round])
    response = user_api_client.get(reverse("reservationunit-list"))
    assert response.status_code == 200
    assert len(response.data) == 2

    # GET with application_round pk as a query paremeter should return one reservation unit
    url = f"{reverse('reservationunit-list')}?application_round={application_round.pk}"
    response = user_api_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["name"]["en"] == reservation_unit.name_en


@pytest.mark.django_db()
def test_reservation_unit_search_filter(user_api_client, reservation_unit, reservation_unit2):
    response = user_api_client.get(reverse("reservationunit-list"))
    assert len(response.data) == 2

    reservation_unit.name_fi = "Lorem ipsum"
    reservation_unit.save()
    reservation_unit2.name_fi = "Dolor amet"
    reservation_unit2.save()

    url = f"{reverse('reservationunit-list')}?search=lorem"
    response = user_api_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["name"]["fi"] == reservation_unit.name_fi

    url = f"{reverse('reservationunit-list')}?search=DOLOR"
    response = user_api_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["name"]["fi"] == reservation_unit2.name


@pytest.mark.django_db()
def test_reservation_unit_max_persons_filter(user_api_client, reservation_unit, reservation_unit2):
    response = user_api_client.get(reverse("reservationunit-list"))
    assert response.status_code == 200
    assert len(response.data) == 2

    space = reservation_unit.spaces.all()[0]
    space.max_persons = 10
    space.save()

    url = f"{reverse('reservationunit-list')}?max_persons=10"
    response = user_api_client.get(url)

    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["name"]["en"] == reservation_unit.name_en


@pytest.mark.django_db()
def test_reservation_unit_is_draft_filter_true(user_api_client, reservation_unit, reservation_unit2):
    response = user_api_client.get(reverse("reservationunit-list"))
    assert response.status_code == 200
    assert len(response.data) == 2

    url = f"{reverse('reservationunit-list')}?is_draft=true"
    response = user_api_client.get(url)

    assert response.status_code == 200
    assert len(response.data) == 0


@pytest.mark.django_db()
def test_reservation_unit_is_draft_filter_false(user_api_client, reservation_unit, reservation_unit2):
    response = user_api_client.get(reverse("reservationunit-list"))
    assert response.status_code == 200
    assert len(response.data) == 2

    url = f"{reverse('reservationunit-list')}?is_draft=false"
    response = user_api_client.get(url)

    assert response.status_code == 200
    assert len(response.data) == 2


# Permission tests starts here
@pytest.mark.django_db()
def test_unauthenticated_cannot_create_reservation_unit(unauthenticated_api_client, valid_reservation_unit_data):
    response = unauthenticated_api_client.post(
        reverse("reservationunit-list"), valid_reservation_unit_data, format="json"
    )
    assert response.status_code == 401


@pytest.mark.django_db()
def test_normal_user_cannot_create_reservation_unit(user_api_client, valid_reservation_unit_data):
    response = user_api_client.post(reverse("reservationunit-list"), valid_reservation_unit_data, format="json")
    assert response.status_code == 403


@pytest.mark.django_db()
def test_normal_user_cannot_update_reservation_unit(user_api_client, valid_reservation_unit_data, reservation_unit):
    response = user_api_client.put(
        reverse("reservationunit-detail", kwargs={"pk": reservation_unit.id}),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 403


@pytest.mark.django_db()
def test_general_admin_can_create_reservation(general_admin_api_client, valid_reservation_unit_data):
    response = general_admin_api_client.post(
        reverse("reservationunit-list"), valid_reservation_unit_data, format="json"
    )
    assert response.status_code == 201


@pytest.mark.django_db()
def test_unit_group_admin_can_create_reservation_unit(unit_group_admin_api_client, valid_reservation_unit_data):
    response = unit_group_admin_api_client.post(
        reverse("reservationunit-list"),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 201


@pytest.mark.django_db()
def test_unit_group_admin_can_update_reservation_unit(
    unit_group_admin_api_client, valid_reservation_unit_data, reservation_unit
):
    response = unit_group_admin_api_client.put(
        reverse("reservationunit-detail", kwargs={"pk": reservation_unit.id}),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db()
def test_unit_admin_can_create_reservation_unit(unit_admin_api_client, valid_reservation_unit_data):
    response = unit_admin_api_client.post(
        reverse("reservationunit-list"),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 201


@pytest.mark.django_db()
def test_unit_admin_can_update_reservation_unit(unit_admin_api_client, valid_reservation_unit_data, reservation_unit):
    response = unit_admin_api_client.put(
        reverse("reservationunit-detail", kwargs={"pk": reservation_unit.id}),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db()
def test_unit_manager_can_create_reservation_unit(unit_manager_api_client, valid_reservation_unit_data):
    response = unit_manager_api_client.post(
        reverse("reservationunit-list"),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 201


@pytest.mark.django_db()
def test_unit_manager_can_update_reservation_unit(
    unit_manager_api_client, valid_reservation_unit_data, reservation_unit
):
    response = unit_manager_api_client.put(
        reverse("reservationunit-detail", kwargs={"pk": reservation_unit.id}),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db()
def test_unit_viewer_cannot_update_reservation_unit(
    unit_viewer_api_client, valid_reservation_unit_data, reservation_unit
):
    response = unit_viewer_api_client.put(
        reverse("reservationunit-detail", kwargs={"pk": reservation_unit.id}),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 403


@pytest.mark.django_db()
def test_service_sector_admin_can_create_reservation_unit(service_sector_admin_api_client, valid_reservation_unit_data):
    response = service_sector_admin_api_client.post(
        reverse("reservationunit-list"),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 201


@pytest.mark.django_db()
def test_service_sector_admin_can_update_reservation_unit(
    service_sector_admin_api_client, valid_reservation_unit_data, reservation_unit
):
    response = service_sector_admin_api_client.put(
        reverse("reservationunit-detail", kwargs={"pk": reservation_unit.id}),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db()
def test_service_sector_application_manager_cannot_update_reservation_unit(
    service_sector_application_manager_api_client,
    valid_reservation_unit_data,
    reservation_unit,
):
    response = service_sector_application_manager_api_client.put(
        reverse("reservationunit-detail", kwargs={"pk": reservation_unit.id}),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 403


@pytest.mark.django_db()
def test_wrong_service_sectors_admin_cannot_update_reservation_unit(
    service_sector_2_admin_api_client, valid_reservation_unit_data, reservation_unit
):
    response = service_sector_2_admin_api_client.put(
        reverse("reservationunit-detail", kwargs={"pk": reservation_unit.id}),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 403
