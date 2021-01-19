import pytest
from django.urls import reverse

from reservation_units.models import Equipment, EquipmentCategory, ReservationUnit


@pytest.mark.django_db
def test_reservation_unit_exists(user_api_client, reservation_unit):
    reservation_unit.name_en = "Studio complex"
    reservation_unit.save()
    response = user_api_client.get(reverse("reservationunit-list"))
    assert response.status_code == 200
    assert response.data[0]["name"]["en"] == "Studio complex"


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
    assert filtered_response.data[0]["name"]["en"] == reservation_unit.name_en

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
    assert response.data[0]["name"]["en"] == reservation_unit.name_en


@pytest.mark.django_db
def test_reservation_unit_search_filter(
    user_api_client, reservation_unit, reservation_unit2
):
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


@pytest.mark.django_db
def test_reservation_unit_district_filter(
    user_api_client, reservation_unit, reservation_unit2, district, sub_district
):
    response = user_api_client.get(reverse("reservationunit-list"))
    assert response.status_code == 200
    assert len(response.data) == 2

    space = reservation_unit.spaces.all()[0]
    space.district = sub_district
    space.save()
    url = f"{reverse('reservationunit-list')}?district={sub_district.pk}"
    response = user_api_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["name"]["en"] == reservation_unit.name_en

    # We should also get the result by querying for district ID,
    # as sub_district is a subset of the actual district
    url = f"{reverse('reservationunit-list')}?district={district.pk}"
    response = user_api_client.get(url)
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["name"]["en"] == reservation_unit.name_en


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
    assert response.data[0]["name"]["en"] == reservation_unit.name_en


@pytest.mark.django_db
def test_reservation_unit_create(user_api_client, equipment_hammer):
    assert ReservationUnit.objects.count() == 0

    data = {
        "name": {
            "fi": "Uusi varausyksikkö",
            "en": "New reservation unit",
            "sv": "Nya reservation sak",
        },
        "require_introduction": False,
        "terms_of_use": "Do not mess it up",
        "equipment_ids": [equipment_hammer.id],
    }
    response = user_api_client.post(
        reverse("reservationunit-list"), data=data, format="json"
    )
    assert response.status_code == 201
    assert ReservationUnit.objects.count() == 1

    unit = ReservationUnit.objects.all()[0]
    assert unit.name_en == "New reservation unit"
    assert list(map(lambda x: x.id, unit.equipments.all())) == [equipment_hammer.id]


@pytest.mark.django_db
def test_equipment_category_create(user_api_client):
    assert EquipmentCategory.objects.count() == 0
    response = user_api_client.post(
        reverse("equipment_category-list"), data={"name": "New category"}, format="json"
    )
    assert response.status_code == 201
    assert EquipmentCategory.objects.count() == 1


@pytest.mark.django_db
def test_equipment_category_fetch(user_api_client, tools_equipment_category):
    response = user_api_client.get(reverse("equipment_category-list"), format="json")
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0].get("name") == "Household tools"


@pytest.mark.django_db
def test_equipment_create(user_api_client, tools_equipment_category):
    assert Equipment.objects.count() == 0
    response = user_api_client.post(
        reverse("equipment-list"),
        data={"name": "Crowbar", "category_id": tools_equipment_category.id},
        format="json",
    )
    assert response.status_code == 201
    assert Equipment.objects.count() == 1


@pytest.mark.django_db
def test_equipment_fetch(user_api_client, equipment_hammer):
    response = user_api_client.get(reverse("equipment-list"), format="json")
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0].get("name") == "Hammer"

