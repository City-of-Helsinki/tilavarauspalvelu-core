import pytest
from django.urls import reverse


@pytest.mark.django_db
def test_normal_user_cannot_grant_general_roles(
    user_api_client, valid_general_admin_data
):
    response = user_api_client.post(
        reverse("general_role-list"),
        data=valid_general_admin_data,
        format="json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_general_admin_can_grant_general_roles(
    general_admin_api_client, valid_general_admin_data, user
):
    response = general_admin_api_client.post(
        reverse("general_role-list"),
        data=valid_general_admin_data,
        format="json",
    )

    assert response.status_code == 201

    assert user.general_roles.filter(role="admin").exists()


@pytest.mark.django_db
def test_normal_user_cannot_grant_service_sector_roles(
    user_api_client, valid_service_sector_application_manager_data
):
    response = user_api_client.post(
        reverse("service_sector_role-list"),
        data=valid_service_sector_application_manager_data,
        format="json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_service_sector_admin_can_grant_application_manager_role(
    user,
    service_sector_admin_api_client,
    valid_service_sector_application_manager_data,
    service_sector,
):
    response = service_sector_admin_api_client.post(
        reverse("service_sector_role-list"),
        data=valid_service_sector_application_manager_data,
        format="json",
    )
    assert response.status_code == 201

    assert user.service_sector_roles.filter(
        service_sector=service_sector,
        role=valid_service_sector_application_manager_data["role"],
    ).exists()


@pytest.mark.django_db
def test_general_admin_can_grant_service_sector_roles(
    general_admin_api_client, valid_service_sector_admin_data, user, service_sector
):
    response = general_admin_api_client.post(
        reverse("service_sector_role-list"),
        data=valid_service_sector_admin_data,
        format="json",
    )
    assert response.status_code == 201

    assert user.service_sector_roles.filter(
        service_sector=service_sector, role=valid_service_sector_admin_data["role"]
    ).exists()


@pytest.mark.django_db
def test_normal_user_cannot_grant_unit_admin_role(
    user_api_client, valid_unit_admin_data
):
    response = user_api_client.post(
        reverse("unit_role-list"),
        data=valid_unit_admin_data,
        format="json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_unit_manager_cannot_grant_unit_roles(
    unit_manager_api_client, valid_unit_viewer_data
):
    response = unit_manager_api_client.post(
        reverse("unit_role-list"),
        data=valid_unit_viewer_data,
        format="json",
    )
    assert response.status_code == 403


@pytest.mark.django_db
def test_service_sector_admin_can_grant_unit_admin_role(
    service_sector_admin_api_client,
    valid_unit_admin_data,
    user,
    unit,
    service_sector_admin,
):
    response = service_sector_admin_api_client.post(
        reverse("unit_role-list"),
        data=valid_unit_admin_data,
        format="json",
    )

    assert response.status_code == 201
    assert user.unit_roles.filter(
        unit=unit, role=valid_unit_admin_data["role"], assigner=service_sector_admin
    ).exists()


@pytest.mark.django_db
def test_general_admin_can_grant_unit_group_admin_role(
    general_admin_api_client,
    valid_unit_group_admin_data,
    user,
    unit_group,
    general_admin,
):
    response = general_admin_api_client.post(
        reverse("unit_role-list"),
        data=valid_unit_group_admin_data,
        format="json",
    )

    assert response.status_code == 201
    assert user.unit_roles.filter(
        unit_group=unit_group,
        role=valid_unit_group_admin_data["role"],
        assigner=general_admin,
    ).exists()


@pytest.mark.django_db
def test_unit_group_admin_can_grant_unit_admin_role(
    unit_group_admin_api_client, valid_unit_admin_data, user, unit, unit_group_admin
):
    response = unit_group_admin_api_client.post(
        reverse("unit_role-list"),
        data=valid_unit_admin_data,
        format="json",
    )

    assert response.status_code == 201
    assert user.unit_roles.filter(
        unit=unit, role=valid_unit_admin_data["role"], assigner=unit_group_admin
    ).exists()


@pytest.mark.django_db
def test_unit_admin_can_grant_unit_manager_role(
    unit_admin_api_client, valid_unit_manager_data, user, unit, unit_admin
):
    response = unit_admin_api_client.post(
        reverse("unit_role-list"),
        data=valid_unit_manager_data,
        format="json",
    )
    assert response.status_code == 201
    assert user.unit_roles.filter(
        unit=unit, role=valid_unit_manager_data["role"], assigner=unit_admin
    ).exists()


@pytest.mark.django_db
def test_general_admin_can_grant_unit_viewer_role(
    general_admin_api_client, valid_unit_viewer_data, user, unit, general_admin
):
    response = general_admin_api_client.post(
        reverse("unit_role-list"),
        data=valid_unit_viewer_data,
        format="json",
    )

    assert response.status_code == 201
    assert user.unit_roles.filter(
        unit=unit, role=valid_unit_viewer_data["role"], assigner=general_admin
    ).exists()
