import pytest
from rest_framework.reverse import reverse

from applications.models import ApplicationRoundStatus


@pytest.mark.django_db
def test_service_sector_admin_in_unrelated_sector_cant_allocate(
    service_sector_2_admin_api_client, application_round, valid_allocation_request_data
):
    application_round.set_status(ApplicationRoundStatus.REVIEW_DONE)
    application_round.save()
    response = service_sector_2_admin_api_client.post(
        reverse("allocation_request-list"),
        data=valid_allocation_request_data,
        format="json",
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_general_admin_can_allocate(
    general_admin_api_client, application_round, valid_allocation_request_data
):
    application_round.set_status(ApplicationRoundStatus.REVIEW_DONE)
    application_round.save()
    response = general_admin_api_client.post(
        reverse("allocation_request-list"),
        data=valid_allocation_request_data,
        format="json",
    )

    assert response.status_code == 201


@pytest.mark.django_db
def test_normal_user_can_not_allocate(
    user_api_client, application_round, valid_allocation_request_data
):
    application_round.set_status(ApplicationRoundStatus.REVIEW_DONE)
    application_round.save()
    response = user_api_client.post(
        reverse("allocation_request-list"),
        data=valid_allocation_request_data,
        format="json",
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_unit_manager_can_not_allocate(
    unit_manager_api_client, application_round, valid_allocation_request_data
):
    application_round.set_status(ApplicationRoundStatus.REVIEW_DONE)
    application_round.save()
    response = unit_manager_api_client.post(
        reverse("allocation_request-list"),
        data=valid_allocation_request_data,
        format="json",
    )

    assert response.status_code == 403
