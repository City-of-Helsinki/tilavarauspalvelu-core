import pytest
from assertpy import assert_that
from rest_framework.reverse import reverse

from applications.models import ApplicationEventScheduleResult


@pytest.mark.django_db
def test_accepting_allocation_result(
    result_scheduled_for_monday,
    general_admin_api_client
):
    response = general_admin_api_client.put(
        reverse("allocation_results-detail", kwargs={"pk": result_scheduled_for_monday.application_event_schedule.id}),
        data={"accepted": True},
        format="json",
    )

    assert_that(response).has_status_code == 201
    assert_that(response.data["accepted"]).is_true()

@pytest.mark.django_db
def test_deleting_allocation_result(
    result_scheduled_for_monday,
    general_admin_api_client
):

    assert_that(ApplicationEventScheduleResult.objects.count()).is_equal_to(1)
    response = general_admin_api_client.delete(
        reverse("allocation_results-detail", kwargs={"pk": result_scheduled_for_monday.application_event_schedule.id}),
        data={"accepted": False},
        format="json",
    )

    assert_that(response).has_status_code == 201
    assert_that(ApplicationEventScheduleResult.objects.count()).is_equal_to(0)
