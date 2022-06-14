import pytest
from assertpy import assert_that
from rest_framework.reverse import reverse

from applications.models import ApplicationRoundStatus


@pytest.mark.parametrize(
    "round_status",
    [ApplicationRoundStatus.REVIEW_DONE, ApplicationRoundStatus.ALLOCATED],
)
@pytest.mark.django_db
def test_allocation_request_create(
    service_sector_admin_api_client,
    application_round,
    valid_allocation_request_data,
    round_status,
):
    application_round.set_status(round_status)
    application_round.save()
    response = service_sector_admin_api_client.post(
        reverse("allocation_request-list"),
        data=valid_allocation_request_data,
        format="json",
    )

    assert_that(response).has_status_code == 201
    assert_that(response.data["application_round_id"]).is_equal_to(application_round.id)
    assert_that(response.data["completed"]).is_false()


@pytest.mark.parametrize(
    "round_status",
    [
        ApplicationRoundStatus.DRAFT,
        ApplicationRoundStatus.IN_REVIEW,
        ApplicationRoundStatus.REVIEW_DONE,
        ApplicationRoundStatus.ALLOCATED,
        ApplicationRoundStatus.RESERVING,
        ApplicationRoundStatus.HANDLED,
        ApplicationRoundStatus.SENDING,
        ApplicationRoundStatus.SENT,
        ApplicationRoundStatus.ARCHIVED,
    ],
)
@pytest.mark.django_db
def test_should_not_allocate_in_wrong_statuses(
    service_sector_admin_api_client,
    user,
    application_round,
    valid_allocation_request_data,
    round_status,
):
    application_round.set_status(round_status)
    application_round.save()
    response = service_sector_admin_api_client.post(
        reverse("allocation_request-list"),
        data=valid_allocation_request_data,
        format="json",
    )

    assert_that(response).has_status_code = 400


@pytest.mark.django_db
def test_should_not_allocate_when_allocation_in_process(
    service_sector_admin_api_client,
    user,
    application_round,
    allocation_request_in_progress,
    valid_allocation_request_data,
):
    application_round.set_status(ApplicationRoundStatus.REVIEW_DONE)
    application_round.save()
    response = service_sector_admin_api_client.post(
        reverse("allocation_request-list"),
        data=valid_allocation_request_data,
        format="json",
    )

    assert_that(response).has_status_code = 400
