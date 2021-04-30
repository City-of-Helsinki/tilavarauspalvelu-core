from rest_framework.reverse import reverse


def test_normal_user_cannot_access_results_without_service_sector(user_api_client):
    response = user_api_client.get(
        reverse("allocation_results-list"),
        format="json",
    )

    assert response.status_code == 403


def test_normal_user_cannot_access_results_with_service_sector(user_api_client):
    response = user_api_client.get(
        reverse("allocation_results-list"),
        data={"service_sector_id": 1},
        format="json",
    )

    assert response.status_code == 403


def test_general_admin_user_can_access_results_without_service_sector(
    general_admin_api_client,
):
    response = general_admin_api_client.get(
        reverse("allocation_results-list"),
        format="json",
    )

    assert response.status_code == 200


def test_staff_user_can_access_results(staff_user_api_client):
    response = staff_user_api_client.get(
        reverse("allocation_results-list"),
        format="json",
    )

    assert response.status_code == 403


def test_staff_cannot_post(staff_user_api_client):
    response = staff_user_api_client.post(
        reverse("allocation_results-list"),
        data={},
        format="json",
    )

    assert response.status_code == 403


def test_normal_user_cannot_post(user_api_client):
    response = user_api_client.post(
        reverse("allocation_results-list"),
        data={},
        format="json",
    )

    assert response.status_code == 403


def test_service_sector_admin_cant_access_results_without_service_sector_data(
    service_sector_application_manager_api_client, service_sector
):
    response = service_sector_application_manager_api_client.get(
        reverse("allocation_results-list"),
        format="json",
    )

    assert response.status_code == 403


def test_service_sector_admin_can_access_results(
    service_sector_application_manager_api_client,
    service_sector,
):
    response = service_sector_application_manager_api_client.get(
        reverse("allocation_results-list"),
        data={"service_sector_id": service_sector.id},
        format="json",
    )

    assert response.status_code == 200


def test_service_sector_admin_cant_post_results(
    service_sector_application_manager_api_client, service_sector
):
    response = service_sector_application_manager_api_client.post(
        reverse("allocation_results-list"),
        data={},
        format="json",
    )

    assert response.status_code == 403
