from __future__ import annotations

import csv
import io
from typing import TYPE_CHECKING

import pytest
from django.contrib.messages import get_messages
from django.urls import reverse
from freezegun import freeze_time

from tilavarauspalvelu.enums import Priority
from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient
from utils.date_utils import local_datetime

from tests.factories import (
    ApplicationFactory,
    ApplicationRoundFactory,
    HaukiAPIResourceListResponseFactory,
    OriginHaukiResourceFactory,
    UserFactory,
)
from tests.helpers import ResponseMock, as_mock, patch_method

if TYPE_CHECKING:
    from rest_framework.test import APIClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Application round CSV exports ──


@freeze_time(local_datetime(2024, 1, 1, 12))
def test_application_round_admin__export_applications_to_csv__exports_the_round_applications(
    api_client: APIClient,
) -> None:
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    application_round = ApplicationRoundFactory.create_in_status_in_allocation()
    application = ApplicationFactory.create_in_status_in_allocation(
        application_round=application_round,
        application_sections__suitable_time_ranges__priority=Priority.PRIMARY,
    )
    other_application = ApplicationFactory.create_in_status_in_allocation(
        application_sections__suitable_time_ranges__priority=Priority.PRIMARY,
    )

    url = reverse(
        "admin:tilavarauspalvelu_applicationround_export_applications_to_csv",
        args=[application_round.pk],
    )
    response = api_client.get(url)

    assert response.status_code == 200
    assert response["Content-Disposition"] == (
        f"attachment;filename=application_round_applications_{application_round.pk}_2024-01-01.csv"
    )

    content = response.getvalue().decode()
    application_ids = {row[0] for row in csv.reader(io.StringIO(content)) if row}
    assert str(application.pk) in application_ids
    assert str(other_application.pk) not in application_ids


def test_application_round_admin__export_applications_to_csv__invalid_id_shows_an_error(api_client: APIClient) -> None:
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    url = reverse("admin:tilavarauspalvelu_applicationround_export_applications_to_csv", args=["invalid"])
    response = api_client.get(url)

    messages = [message.message for message in get_messages(response.wsgi_request)]
    assert messages == ["Could not export the applications."]


@freeze_time(local_datetime(2024, 1, 1, 12))
def test_application_round_admin__export_results_to_csv__exports_the_round_results(api_client: APIClient) -> None:
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    application_round = ApplicationRoundFactory.create_in_status_handled()

    url = reverse("admin:tilavarauspalvelu_applicationround_export_results_to_csv", args=[application_round.pk])
    response = api_client.get(url)

    assert response.status_code == 200
    assert response["Content-Disposition"] == (
        f"attachment;filename=application_round_results_{application_round.pk}_2024-01-01.csv"
    )


def test_application_round_admin__export_results_to_csv__invalid_id_shows_an_error(api_client: APIClient) -> None:
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    url = reverse("admin:tilavarauspalvelu_applicationround_export_results_to_csv", args=["invalid"])
    response = api_client.get(url)

    messages = [message.message for message in get_messages(response.wsgi_request)]
    assert messages == ["Could not export the results."]


# ── Origin hauki resource reservable time spans ──


@patch_method(HaukiAPIClient.get)
def test_origin_hauki_resource_admin__update_reservable_time_spans__fetches_the_resource(api_client: APIClient) -> None:
    user = UserFactory.create_superuser()
    api_client.force_login(user)

    resource = OriginHaukiResourceFactory.create()
    data = HaukiAPIResourceListResponseFactory.create(results=[])
    as_mock(HaukiAPIClient.get).return_value = ResponseMock(status_code=200, json_data=data)

    url = reverse(
        "admin:tilavarauspalvelu_originhaukiresource_update_single_hauki_resource_reservable_times_pans",
        args=[resource.pk],
    )
    response = api_client.get(url)

    assert as_mock(HaukiAPIClient.get).call_count == 1
    assert as_mock(HaukiAPIClient.get).call_args.kwargs["params"] == {"resource_ids": str(resource.pk)}

    messages = [message.message for message in get_messages(response.wsgi_request)]
    assert messages == ["Reservable Time Spans updated."]
