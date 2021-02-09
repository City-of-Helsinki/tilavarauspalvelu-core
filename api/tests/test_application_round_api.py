import pytest
from django.urls import reverse

from applications.models import ApplicationRoundStatus


@pytest.mark.django_db
def test_application_round_fetch(user_api_client, application_round):
    response = user_api_client.get(reverse("application_round-list"))
    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0].get("id") == application_round.id


@pytest.mark.django_db
def test_create_application_round(user, user_api_client, valid_application_round_data):
    response = user_api_client.post(
        reverse("application_round-list"),
        data=valid_application_round_data,
        format="json",
    )

    assert response.status_code == 201
    assert response.data["status"] == ApplicationRoundStatus.DRAFT
    assert response.data["name"] == valid_application_round_data["name"]


@pytest.mark.django_db
def test_update_application_round(
    user, user_api_client, application_round, valid_application_round_data
):
    data = {**valid_application_round_data, "status": ApplicationRoundStatus.PUBLISHED}
    response = user_api_client.put(
        reverse("application_round-detail", kwargs={"pk": application_round.id}),
        data=data,
        format="json",
    )
    assert response.status_code == 200

    application_round.refresh_from_db()

    assert application_round.status == ApplicationRoundStatus.PUBLISHED
    assert application_round.name == valid_application_round_data["name"]
