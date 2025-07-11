from __future__ import annotations

import urllib.parse

import freezegun
import pytest
from graphql_relay import to_global_id

from tilavarauspalvelu.exceptions import HaukiAPIError
from tilavarauspalvelu.integrations.opening_hours.hauki_resource_hash_updater import HaukiResourceHashUpdater
from tilavarauspalvelu.models.reservation_unit.actions import ReservationUnitHaukiExporter

from tests.factories import OriginHaukiResourceFactory, ReservationUnitFactory
from tests.helpers import patch_method

from .helpers import UPDATE_MUTATION, get_draft_update_input_data, reservation_unit_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(HaukiResourceHashUpdater.run)
@patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki)
def test_reservation_unit__update__send_resource_to_hauki_when_resource_id_exists(graphql, settings):
    settings.HAUKI_EXPORTS_ENABLED = True
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(
        is_draft=True,
        origin_hauki_resource=OriginHaukiResourceFactory.create(),
    )
    data = get_draft_update_input_data(reservation_unit)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    assert HaukiResourceHashUpdater.run.call_count == 1
    assert ReservationUnitHaukiExporter.send_reservation_unit_to_hauki.call_count == 1


@patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki)
def test_reservation_unit__update__send_resource_to_hauki_when_resource_id_doesnt_exist(graphql, settings):
    settings.HAUKI_EXPORTS_ENABLED = True
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit)

    response = graphql(UPDATE_MUTATION, input_data=data)
    assert response.has_errors is False, response

    assert ReservationUnitHaukiExporter.send_reservation_unit_to_hauki.call_count == 1


@patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki)
def test_reservation_unit__update__send_resource_to_hauki_when_exports_disabled(graphql, settings):
    settings.HAUKI_EXPORTS_ENABLED = False
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit)

    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.has_errors is False, response

    assert ReservationUnitHaukiExporter.send_reservation_unit_to_hauki.call_count == 0


@patch_method(ReservationUnitHaukiExporter.send_reservation_unit_to_hauki, side_effect=HaukiAPIError("foo"))
def test_reservation_unit__update__send_resource_to_hauki_errors_returns_error_message(graphql, settings):
    settings.HAUKI_EXPORTS_ENABLED = True
    graphql.login_with_superuser()

    reservation_unit = ReservationUnitFactory.create(is_draft=True)
    data = get_draft_update_input_data(reservation_unit)
    response = graphql(UPDATE_MUTATION, input_data=data)

    assert response.error_message() == "Sending reservation unit as resource to HAUKI failed."

    assert ReservationUnitHaukiExporter.send_reservation_unit_to_hauki.call_count == 1


@freezegun.freeze_time("2023-01-01T12:00:00+02:00")
def test_reservation_unit__query__hauki_url__regular_user(graphql):
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
def test_reservation_unit__query__hauki_url__superuser(graphql, settings):
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


def test_reservation_unit__query__hauki_url__superuser__no_hauki_resource(graphql):
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
