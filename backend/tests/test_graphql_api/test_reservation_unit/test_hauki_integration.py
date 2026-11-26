from __future__ import annotations

import urllib.parse
from typing import TYPE_CHECKING

import freezegun
import pytest
from graphql_relay import to_global_id

from tilavarauspalvelu.exceptions import HaukiAPIError
from tilavarauspalvelu.integrations.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.integrations.opening_hours.hauki_resource_hash_updater import HaukiResourceHashUpdater
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models.reservation_unit.actions import ReservationUnitHaukiExporter

from tests.factories import OriginHaukiResourceFactory, ReservationUnitFactory
from tests.helpers import ResponseMock, as_mock, patch_method

from .helpers import (
    UPDATE_MUTATION,
    UPDATE_MUTATION_WITH_HAUKI_EXPORT_FAILED,
    get_draft_update_input_data,
    reservation_unit_query,
)

if TYPE_CHECKING:
    from pytest_django import Settings

    from tests.helpers import GraphQLClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(HaukiResourceHashUpdater.run)
@patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki)
def test_reservation_unit__update__send_resource_to_hauki_when_resource_id_exists(
    graphql: GraphQLClient, settings: Settings
) -> None:
    settings.HAUKI_EXPORTS_ENABLED = True
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(
        is_draft=True,
        origin_hauki_resource=OriginHaukiResourceFactory.create(),
    )
    data = get_draft_update_input_data(reservation_unit)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    assert as_mock(HaukiResourceHashUpdater.run).call_count == 1
    assert as_mock(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki).call_count == 1


@patch_method(HaukiAPIClient.request, return_value=ResponseMock(status_code=503, url="https://hauki.test/resource/"))
@patch_method(SentryLogger.log_exception)
def test_reservation_unit__update__opening_hours_refetch_error_does_not_fail_mutation(
    graphql: GraphQLClient, settings: Settings
) -> None:
    settings.HAUKI_EXPORTS_ENABLED = False
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(
        is_draft=True,
        name="old name",
        origin_hauki_resource=OriginHaukiResourceFactory.create(),
    )
    data = get_draft_update_input_data(reservation_unit, name="new name")

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    reservation_unit.refresh_from_db()
    assert reservation_unit.name == "new name"

    assert as_mock(SentryLogger.log_exception).call_count == 1
    error = as_mock(SentryLogger.log_exception).call_args.args[0]
    assert str(error) == "GET request to HAUKI (https://hauki.test/resource/) failed with status 503."
    assert as_mock(SentryLogger.log_exception).call_args.kwargs == {
        "details": f"Reservation unit: {reservation_unit.pk}"
    }


@patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki)
def test_reservation_unit__update__send_resource_to_hauki_when_resource_id_doesnt_exist(
    graphql: GraphQLClient, settings: Settings
) -> None:
    settings.HAUKI_EXPORTS_ENABLED = True
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    assert as_mock(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki).call_count == 1


@patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki)
def test_reservation_unit__update__send_resource_to_hauki_when_exports_disabled(
    graphql: GraphQLClient, settings: Settings
) -> None:
    settings.HAUKI_EXPORTS_ENABLED = False
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit)

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    assert as_mock(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki).call_count == 0


@patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki)
def test_reservation_unit__update__send_resource_to_hauki__export_failed_is_false(
    graphql: GraphQLClient, settings: Settings
) -> None:
    settings.HAUKI_EXPORTS_ENABLED = True
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit)
    response = graphql(UPDATE_MUTATION_WITH_HAUKI_EXPORT_FAILED, input_data=data)

    assert response.has_errors is False, response
    assert response.first_query_object == {"pk": reservation_unit.pk, "haukiExportFailed": False}


@patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki, side_effect=HaukiAPIError("foo"))
@patch_method(SentryLogger.log_exception)
def test_reservation_unit__update__send_resource_to_hauki_error_does_not_fail_mutation(
    graphql: GraphQLClient, settings: Settings
) -> None:
    settings.HAUKI_EXPORTS_ENABLED = True
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True, name="old name")
    data = get_draft_update_input_data(reservation_unit, name="new name")
    response = graphql(UPDATE_MUTATION_WITH_HAUKI_EXPORT_FAILED, input_data=data)

    assert response.has_errors is False, response
    assert response.first_query_object == {"pk": reservation_unit.pk, "haukiExportFailed": True}

    reservation_unit.refresh_from_db()
    assert reservation_unit.name == "new name"

    assert as_mock(SentryLogger.log_exception).call_count == 1
    error = as_mock(SentryLogger.log_exception).call_args.args[0]
    assert isinstance(error, HaukiAPIError)
    assert str(error) == "foo"
    assert as_mock(SentryLogger.log_exception).call_args.kwargs == {
        "details": f"Reservation unit: {reservation_unit.pk}"
    }


@freezegun.freeze_time("2023-01-01T12:00:00+02:00")
def test_reservation_unit__query__hauki_url__regular_user(graphql: GraphQLClient) -> None:
    graphql.login_with_regular_user()

    reservation_unit = ReservationUnitFactory.create(
        unit__tprek_department_id="ORGANISATION",
        ext_uuid="3774af34-9916-40f2-acc7-68db5a627710",
    )

    global_id = to_global_id("ReservationUnitNode", reservation_unit.pk)
    query = reservation_unit_query(fields="haukiUrl", id=global_id)
    response = graphql(query)

    assert response.error_message("haukiUrl") == "No permission to access field."


@freezegun.freeze_time("2023-01-01T12:00:00+02:00")
def test_reservation_unit__query__hauki_url__superuser(graphql: GraphQLClient, settings: Settings) -> None:
    user = graphql.login_with_superuser()

    origin_hauki_resource = OriginHaukiResourceFactory.create()
    reservation_unit = ReservationUnitFactory.create(
        unit__tprek_department_id="ORGANISATION",
        ext_uuid="3774af34-9916-40f2-acc7-68db5a627710",
        origin_hauki_resource=origin_hauki_resource,
    )

    global_id = to_global_id("ReservationUnitNode", reservation_unit.pk)
    query = reservation_unit_query(fields="haukiUrl", id=global_id)
    response = graphql(query)

    assert response.has_errors is False, response.errors

    url = settings.HAUKI_ADMIN_UI_URL + urllib.parse.quote(
        string=(
            f"/resource/{settings.HAUKI_ORIGIN_ID}:{reservation_unit.ext_uuid}/"
            f"?hsa_source={settings.HAUKI_ORIGIN_ID}"
            f"&hsa_username={user.email}"
            f"&hsa_organization={reservation_unit.unit.hauki_department_id}"
            f"&hsa_created_at=2023-01-01T12:00:00+02:00"
            f"&hsa_valid_until=2023-01-01T12:30:00+02:00"
            f"&hsa_resource={settings.HAUKI_ORIGIN_ID}:{reservation_unit.ext_uuid}"
            f"&hsa_has_organization_rights=true"
            # See: `opening_hours.utils.hauki_link_generator.generate_hauki_link`
            f"&hsa_signature=1dc8823af4b4dfe050de12893adcb11e9ea457e53905181006a9e2345f65ee1f"
        ),
        safe="/&?=",
    )

    assert response.first_query_object == {"haukiUrl": url}


def test_reservation_unit__query__hauki_url__superuser__no_hauki_resource(graphql: GraphQLClient) -> None:
    reservation_unit = ReservationUnitFactory.create(
        unit__tprek_department_id="ORGANISATION",
        ext_uuid="3774af34-9916-40f2-acc7-68db5a627710",
        origin_hauki_resource=None,
    )

    global_id = to_global_id("ReservationUnitNode", reservation_unit.pk)
    query = reservation_unit_query(fields="haukiUrl", id=global_id)
    graphql.login_with_superuser()
    response = graphql(query)

    assert response.has_errors is False, response.errors
    assert response.first_query_object == {"haukiUrl": None}
