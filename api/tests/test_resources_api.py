import pytest
from django.urls import reverse

from resources.models import Resource


@pytest.mark.django_db
def test_resource_create(user_api_client, valid_resource_data):
    assert Resource.objects.count() == 0
    response = user_api_client.post(
        reverse("resource-list"), data=valid_resource_data, format="json"
    )
    assert response.status_code == 201
    assert Resource.objects.count() == 1


@pytest.mark.django_db
def test_translatedmodelserializer(user_api_client, valid_resource_data):
    assert Resource.objects.count() == 0
    # POST should be able to create a resource with nested name structure from valid_resource_data
    response = user_api_client.post(
        reverse("resource-list"), data=valid_resource_data, format="json"
    )
    assert response.status_code == 201
    assert Resource.objects.count() == 1

    response = user_api_client.get(reverse("resource-list"))
    # Translated fields should not exist in flat structure
    assert "name_fi" not in response.data
    assert "name_en" not in response.data
    assert "name_sv" not in response.data
    # Translated fields should exist in nested structure
    assert response.data[0]["name"]["fi"] == valid_resource_data["name"]["fi"]
    assert response.data[0]["name"]["en"] == valid_resource_data["name"]["en"]
    assert response.data[0]["name"]["sv"] == valid_resource_data["name"]["sv"]
