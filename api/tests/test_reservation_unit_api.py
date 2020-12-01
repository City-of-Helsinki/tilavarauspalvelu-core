import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_reservation_unit_exists(user_api_client, reservation_unit):
    reservation_unit.name = "Studiokompleksi"
    reservation_unit.save()
    response = user_api_client.get(reverse("reservationunit-list"))
    assert response.status_code == 200
    assert response.data[0]["name"] == "Studiokompleksi"


@pytest.mark.django_db
def test_reservation_unit_purpose_filter(
    user_api_client, reservation_unit, reservation_unit2, purpose, purpose2
):
    reservation_unit.purposes.set([purpose])
    reservation_unit2.purposes.set([purpose2])
    response = user_api_client.get(reverse("reservationunit-list"))
    assert response.status_code == 200
    assert len(response.data) == 2

    url_with_filter = f"{reverse('reservationunit-list')}?purpose={purpose.pk}"
    filtered_response = user_api_client.get(url_with_filter)
    assert filtered_response.status_code == 200
    assert len(filtered_response.data) == 1
    assert filtered_response.data[0]["name"] == reservation_unit.name

    # Filter should work with multiple query parameters
    url_with_filter = (
        f"{reverse('reservationunit-list')}?purpose={purpose.pk}&purpose={purpose2.pk}"
    )
    filtered_response = user_api_client.get(url_with_filter)
    assert filtered_response.status_code == 200
    assert len(filtered_response.data) == 2


@pytest.mark.django_db
def test_reservation_unit_application_period_filter(
    user_api_client, reservation_unit, reservation_unit2, application_period
):
    # GET without query paremeters should return all (2) reservation units
    reservation_unit.application_periods.set([application_period])
    response = user_api_client.get(reverse("reservationunit-list"))
    assert response.status_code == 200
    assert len(response.data) == 2

    # GET with application_period pk as a query paremeter should return one reservation unit
    url = (
        f"{reverse('reservationunit-list')}?application_period={application_period.pk}"
    )
    response = user_api_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["name"] == reservation_unit.name


@pytest.mark.django_db
def test_reservation_unit_search_filter(
    user_api_client, reservation_unit, reservation_unit2
):
    response = user_api_client.get(reverse("reservationunit-list"))
    assert len(response.data) == 2

    reservation_unit.name = "Lorem ipsum"
    reservation_unit.save()
    reservation_unit2.name = "Dolor amet"
    reservation_unit2.save()

    url = f"{reverse('reservationunit-list')}?search=lorem"
    response = user_api_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["name"] == reservation_unit.name

    url = f"{reverse('reservationunit-list')}?search=DOLOR"
    response = user_api_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["name"] == reservation_unit2.name


@pytest.mark.django_db
def test_reservation_unit_location_filter(
    user_api_client, reservation_unit, reservation_unit2, location
):
    response = user_api_client.get(reverse("reservationunit-list"))
    assert response.status_code == 200
    assert len(response.data) == 2

    # We assume only reservation_unit has location
    url = f"{reverse('reservationunit-list')}?location={location.pk}"
    response = user_api_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["name"] == reservation_unit.name


@pytest.mark.django_db
def test_reservation_unit_max_persons_filter(
    user_api_client, reservation_unit, reservation_unit2
):
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
    assert response.data[0]["name"] == reservation_unit.name
