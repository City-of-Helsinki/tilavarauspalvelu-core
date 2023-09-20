import pytest
from rest_framework.reverse import reverse


@pytest.mark.django_db()
def test_general_admin_can_create_cities(general_admin_api_client, application_round):
    response = general_admin_api_client.post(
        reverse("city-list"),
        data={"name": "Tampere"},
        format="json",
    )

    assert response.status_code == 201
    assert response.data["name"] == "Tampere"


@pytest.mark.django_db()
def test_normal_user_cant_create_cities(user_api_client, application_round):
    response = user_api_client.post(
        reverse("city-list"),
        data={"name": "Tampere"},
        format="json",
    )

    assert response.status_code == 403
