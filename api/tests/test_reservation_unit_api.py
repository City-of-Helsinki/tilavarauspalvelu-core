import pytest
from django.urls import reverse

from reservation_units.models import Equipment, EquipmentCategory, ReservationUnit
from reservation_units.tests.factories import ReservationUnitPurposeFactory


@pytest.mark.django_db
def test_reservation_unit_exists(user_api_client, reservation_unit):
    reservation_unit.name_en = "Studio complex"
    reservation_unit.save()
    response = user_api_client.get(reverse("reservationunit-list"))
    assert response.status_code == 200
    assert response.data[0]["name"]["en"] == "Studio complex"


@pytest.mark.django_db
def test_reservation_unit_purpose_filter(
    user_api_client, reservation_unit, reservation_unit2
):
    purpose = ReservationUnitPurposeFactory()
    purpose2 = ReservationUnitPurposeFactory()
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
def test_reservation_unit_create(
    user, user_api_client, equipment_hammer, valid_reservation_unit_data
):
    assert ReservationUnit.objects.count() == 0

    # Test without permissions
    response = user_api_client.post(
        reverse("reservationunit-list"), data=valid_reservation_unit_data, format="json"
    )
    assert response.status_code == 403

    # Test with unit manager role
    user.unit_roles.create(
        unit_id=valid_reservation_unit_data["unit_id"], user=user, role_id="manager"
    )
    response = user_api_client.post(
        reverse("reservationunit-list"), data=valid_reservation_unit_data, format="json"
    )
    assert response.status_code == 201

    assert ReservationUnit.objects.count() == 1
    unit = ReservationUnit.objects.all()[0]
    assert unit.name_en == "New reservation unit"
    assert list(map(lambda x: x.id, unit.equipments.all())) == [equipment_hammer.id]


@pytest.mark.django_db
def test_equipment_category_create(user_api_client, general_admin_api_client):
    assert EquipmentCategory.objects.count() == 0
    response = user_api_client.post(
        reverse("equipment_category-list"), data={"name": "New category"}, format="json"
    )
    assert response.status_code == 403
    response = general_admin_api_client.post(
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
def test_equipment_create(
    user_api_client, general_admin_api_client, tools_equipment_category
):
    assert Equipment.objects.count() == 0
    response = user_api_client.post(
        reverse("equipment-list"),
        data={"name": "Crowbar", "category_id": tools_equipment_category.id},
        format="json",
    )
    assert response.status_code == 403
    response = general_admin_api_client.post(
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


# Permission tests starts here
@pytest.mark.django_db
def test_unauthenticated_cannot_create_reservation_unit(
    unauthenticated_api_client, valid_reservation_unit_data
):
    response = unauthenticated_api_client.post(
        reverse("reservationunit-list"), valid_reservation_unit_data, format="json"
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_normal_user_cannot_create_reservation_unit(
    user_api_client, valid_reservation_unit_data
):
    response = user_api_client.post(
        reverse("reservationunit-list"), valid_reservation_unit_data, format="json"
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_normal_user_cannot_update_reservation_unit(
    user_api_client, valid_reservation_unit_data, reservation_unit
):
    response = user_api_client.put(
        reverse("reservationunit-detail", kwargs={"pk": reservation_unit.id}),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_general_admin_can_create_reservation(
    general_admin_api_client, valid_reservation_unit_data
):
    response = general_admin_api_client.post(
        reverse("reservationunit-list"), valid_reservation_unit_data, format="json"
    )
    assert response.status_code == 201


@pytest.mark.django_db
def test_unit_group_admin_can_create_reservation_unit(
    unit_group_admin_api_client, valid_reservation_unit_data
):
    response = unit_group_admin_api_client.post(
        reverse("reservationunit-list"),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 201


@pytest.mark.django_db
def test_unit_group_admin_can_update_reservation_unit(
    unit_group_admin_api_client, valid_reservation_unit_data, reservation_unit
):
    response = unit_group_admin_api_client.put(
        reverse("reservationunit-detail", kwargs={"pk": reservation_unit.id}),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_unit_admin_can_create_reservation_unit(
    unit_admin_api_client, valid_reservation_unit_data
):
    response = unit_admin_api_client.post(
        reverse("reservationunit-list"),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 201


@pytest.mark.django_db
def test_unit_admin_can_update_reservation_unit(
    unit_admin_api_client, valid_reservation_unit_data, reservation_unit
):
    response = unit_admin_api_client.put(
        reverse("reservationunit-detail", kwargs={"pk": reservation_unit.id}),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_unit_manager_can_create_reservation_unit(
    unit_manager_api_client, valid_reservation_unit_data
):
    response = unit_manager_api_client.post(
        reverse("reservationunit-list"),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 201


@pytest.mark.django_db
def test_unit_manager_can_update_reservation_unit(
    unit_manager_api_client, valid_reservation_unit_data, reservation_unit
):
    response = unit_manager_api_client.put(
        reverse("reservationunit-detail", kwargs={"pk": reservation_unit.id}),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
def test_unit_viewer_cannot_update_reservation_unit(
    unit_viewer_api_client, valid_reservation_unit_data, reservation_unit
):
    response = unit_viewer_api_client.put(
        reverse("reservationunit-detail", kwargs={"pk": reservation_unit.id}),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_service_sector_admin_can_create_reservation_unit(
    service_sector_admin_api_client, valid_reservation_unit_data
):
    response = service_sector_admin_api_client.post(
        reverse("reservationunit-list"),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 201


@pytest.mark.django_db
def test_service_sector_admin_can_update_reservation_unit(
    service_sector_admin_api_client, valid_reservation_unit_data, reservation_unit
):
    response = service_sector_admin_api_client.put(
        reverse("reservationunit-detail", kwargs={"pk": reservation_unit.id}),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 200


@pytest.mark.django_db
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


@pytest.mark.django_db
def test_wrong_service_sectors_admin_cannot_update_reservation_unit(
    service_sector_2_admin_api_client, valid_reservation_unit_data, reservation_unit
):
    response = service_sector_2_admin_api_client.put(
        reverse("reservationunit-detail", kwargs={"pk": reservation_unit.id}),
        data=valid_reservation_unit_data,
        format="json",
    )
    assert response.status_code == 403
